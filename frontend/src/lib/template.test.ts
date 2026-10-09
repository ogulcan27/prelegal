import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultNdaData } from "./nda";
import { parseInline, parseMndaTemplate, refValue } from "./template";

const templatesDir = path.resolve(__dirname, "../../../templates");
const read = (name: string) => readFileSync(path.join(templatesDir, name), "utf8");

describe("parseMndaTemplate", () => {
  const template = parseMndaTemplate(read("Mutual-NDA.md"), read("Mutual-NDA-coverpage.md"));

  it("parses all 11 numbered Standard Terms clauses in order", () => {
    expect(template.clauses.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(template.clauses[0].title).toBe("Introduction");
    expect(template.clauses[8].title).toBe("Governing Law and Jurisdiction");
  });

  it("recognises every cover page reference", () => {
    const refs = new Set(
      template.clauses.flatMap((c) => c.body.flatMap((s) => (s.kind === "ref" ? [s.name] : []))),
    );
    expect(refs).toEqual(
      new Set(["Purpose", "Effective Date", "MNDA Term", "Term of Confidentiality", "Governing Law", "Jurisdiction"]),
    );
  });

  it("extracts the cover page intro and attribution", () => {
    expect(template.coverIntro[0]).toMatchObject({ kind: "text" });
    expect(template.attribution.some((s) => s.kind === "link" && s.text === "CC BY 4.0")).toBe(true);
  });

  it("rejects text that is not a Common Paper MNDA", () => {
    expect(() => parseMndaTemplate("# Nothing here", "")).toThrow(/expected Common Paper format/);
  });
});

describe("parseInline", () => {
  it("splits bold, links, references and plain text", () => {
    expect(
      parseInline('A **B** for the <span class="coverpage_link">Purpose</span> see [here](https://x.test).'),
    ).toEqual([
      { kind: "text", text: "A " },
      { kind: "text", text: "B", bold: true },
      { kind: "text", text: " for the " },
      { kind: "ref", name: "Purpose" },
      { kind: "text", text: " see " },
      { kind: "link", text: "here", href: "https://x.test" },
      { kind: "text", text: "." },
    ]);
  });

  it("throws on unknown references so template changes are caught", () => {
    expect(() => parseInline('<span class="coverpage_link">Price</span>')).toThrow(/Unknown cover page reference/);
  });
});

describe("refValue", () => {
  it("substitutes governing law and jurisdiction", () => {
    const data = { ...defaultNdaData, governingLaw: "Delaware", jurisdiction: "" };
    expect(refValue("Governing Law", data)).toEqual({ text: "Delaware", missing: false });
    expect(refValue("Jurisdiction", data)).toEqual({ text: "[Jurisdiction]", missing: true });
  });

  it("returns null for defined terms, which keep their name", () => {
    expect(refValue("Purpose", defaultNdaData)).toBeNull();
  });
});
