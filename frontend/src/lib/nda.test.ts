import { describe, expect, it } from "vitest";
import {
  confidentialityText,
  coverSections,
  defaultNdaData,
  formatDate,
  mndaTermText,
  pdfFileName,
  signatureRows,
  todayIso,
  valueOr,
  type NdaData,
} from "./nda";

const data = (overrides: Partial<NdaData> = {}): NdaData => ({ ...defaultNdaData, ...overrides });

describe("dates", () => {
  it("formats ISO dates without time zone drift", () => {
    expect(formatDate("2026-01-01")).toEqual({ text: "January 1, 2026", missing: false });
  });

  it("shows a placeholder when no date is set", () => {
    expect(formatDate("")).toEqual({ text: "[Effective Date]", missing: true });
  });

  it("produces today's date in local time", () => {
    expect(todayIso(new Date(2026, 9, 9, 23, 30))).toBe("2026-10-09");
  });
});

describe("terms", () => {
  it("describes a fixed MNDA term or a continuing one", () => {
    expect(mndaTermText(data({ mndaTermYears: 2 })).text).toBe("Expires 2 year(s) from Effective Date.");
    expect(mndaTermText(data({ mndaTermType: "continuous" })).text).toMatch(/^Continues until terminated/);
  });

  it("describes confidentiality in years or in perpetuity", () => {
    expect(confidentialityText(data({ confidentialityYears: 3 })).text).toMatch(/^3 year\(s\) from Effective Date, but/);
    expect(confidentialityText(data({ confidentialityType: "perpetual" })).text).toBe("In perpetuity.");
  });

  it("flags invalid year counts as missing", () => {
    expect(mndaTermText(data({ mndaTermYears: 0 }))).toEqual({ text: "[MNDA Term]", missing: true });
    expect(confidentialityText(data({ confidentialityYears: 1.5 })).missing).toBe(true);
  });
});

describe("cover page", () => {
  it("fills in values and flags empty fields", () => {
    const sections = coverSections(data({ governingLaw: "Delaware" }));
    const law = sections.find((s) => s.heading === "Governing Law & Jurisdiction")!;
    expect(law.lines.map((l) => l.value)).toEqual([
      { text: "Delaware", missing: false },
      { text: "[Jurisdiction]", missing: true },
    ]);
    expect(sections.find((s) => s.heading === "MNDA Modifications")!.lines[0].value.text).toBe("None.");
  });

  it("builds signature rows with blank signature and date lines", () => {
    const rows = signatureRows(
      data({
        parties: [
          { name: "Ada", title: "CEO", company: "Acme", noticeAddress: "ada@acme.test" },
          { name: "Bob", title: "CTO", company: "Globex", noticeAddress: "bob@globex.test" },
        ],
      }),
    );
    expect(rows[0]).toEqual({ label: "Signature", values: ["", ""], toSign: true });
    expect(rows).toContainEqual({ label: "Company", values: ["Acme", "Globex"] });
    expect(rows.at(-1)).toMatchObject({ label: "Date", toSign: true });
  });
});

describe("pdfFileName", () => {
  it("includes sanitised company names, keeping non-ASCII letters", () => {
    const parties: NdaData["parties"] = [
      { ...defaultNdaData.parties[0], company: "Acme, Inc." },
      { ...defaultNdaData.parties[1], company: "Özer Şirketi" },
    ];
    expect(pdfFileName(data({ parties }))).toBe("Mutual-NDA-Acme-Inc-Özer-Şirketi.pdf");
    expect(pdfFileName(defaultNdaData)).toBe("Mutual-NDA.pdf");
  });
});

describe("edge cases", () => {
  it("treats whitespace-only text as empty and trims filled text", () => {
    expect(valueOr("   ", "Purpose")).toEqual({ text: "[Purpose]", missing: true });
    expect(valueOr("  Delaware \n", "Governing Law")).toEqual({ text: "Delaware", missing: false });
  });

  it("shows a placeholder for an invalid date", () => {
    expect(formatDate("not-a-date")).toEqual({ text: "[Effective Date]", missing: true });
  });

  it("ignores the year count when the MNDA continues until terminated", () => {
    expect(mndaTermText(data({ mndaTermType: "continuous", mndaTermYears: 0 })).missing).toBe(false);
  });

  it("trims party details in the signature table", () => {
    const parties: NdaData["parties"] = [
      { ...defaultNdaData.parties[0], name: "  Ada  " },
      defaultNdaData.parties[1],
    ];
    expect(signatureRows(data({ parties }))).toContainEqual({ label: "Print Name", values: ["Ada", ""] });
  });

  it("builds a clean file name from one company or from punctuation-only names", () => {
    const withCompanies = (first: string, second: string): NdaData["parties"] => [
      { ...defaultNdaData.parties[0], company: first },
      { ...defaultNdaData.parties[1], company: second },
    ];
    expect(pdfFileName(data({ parties: withCompanies("", "Globex") }))).toBe("Mutual-NDA-Globex.pdf");
    expect(pdfFileName(data({ parties: withCompanies("!!!", "---") }))).toBe("Mutual-NDA.pdf");
  });
});
