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
    const clause = (n: number) => template.clauses.find((c) => c.number === n)!;
    expect(clause(1).title).toBe("Introduction");
    expect(clause(9).title).toBe("Governing Law and Jurisdiction");
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

  it("handles Windows (CRLF) line endings", () => {
    const parsed = parseMndaTemplate(
      "1. **Introduction**. Hello.\r\n2. **Use**. For the <span class=\"coverpage_link\">Purpose</span>.\r\nCommon Paper attribution\r\n",
      "Title\r\nThis Mutual Non-Disclosure Agreement consists of a Cover Page.\r\n",
    );
    expect(parsed.clauses.map((c) => c.title)).toEqual(["Introduction", "Use"]);
    expect(parsed.clauses[1].body.at(-1)).toEqual({ kind: "text", text: "." });
    expect(parsed.attribution).toEqual([{ kind: "text", text: "Common Paper attribution" }]);
  });

  it("rejects templates that miss the attribution or the cover page intro", () => {
    const clauses = "1. **Introduction**. Hello.";
    const intro = "This Mutual Non-Disclosure Agreement consists of a Cover Page.";
    expect(() => parseMndaTemplate(clauses, intro)).toThrow(/expected Common Paper format/);
    expect(() => parseMndaTemplate(`${clauses}\nCommon Paper attribution`, "No intro here")).toThrow(
      /expected Common Paper format/,
    );
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
