import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { DISCLAIMER } from "@/lib/documents";
import { defaultNdaData, type NdaData } from "@/lib/nda";
import { parseMndaTemplate } from "@/lib/template";
import { NdaPdf } from "./NdaPdf";
import { registerPdfFonts } from "./pdf-parts";
import { inspectPdf as inspect } from "./pdf-inspect";

const root = path.resolve(import.meta.dirname, "../..");
const templatesDir = path.resolve(root, "../templates");
const template = parseMndaTemplate(
  readFileSync(path.join(templatesDir, "Mutual-NDA.md"), "utf8"),
  readFileSync(path.join(templatesDir, "Mutual-NDA-coverpage.md"), "utf8"),
);
registerPdfFonts((file) => path.join(root, "public/fonts", file));

const data: NdaData = {
  ...defaultNdaData,
  effectiveDate: "2026-10-09",
  governingLaw: "Delaware",
  parties: [
    { name: "Oğulcan Özer", title: "Kurucu", company: "Özer Şirketi A.Ş.", noticeAddress: "İstanbul" },
    { name: "Łukasz Nowak", title: "CTO", company: "Globex", noticeAddress: "lukasz@globex.test" },
  ],
};

describe("NdaPdf", () => {
  it("contains the cover page and the Standard Terms with the user's details", () => {
    const { pages, text } = inspect(<NdaPdf template={template} data={data} />);
    expect(pages).toBe(2);
    expect(text).toContain("October 9, 2026");
    expect(text).toContain("the laws of the State of Delaware");
    expect(text).toContain("[Jurisdiction]");
    expect(text).toContain("Oğulcan Özer");
    expect(text).toContain("Özer Şirketi A.Ş.");
    expect(text).toContain("CC BY 4.0");
  });

  it("puts the draft disclaimer at the foot of every page", () => {
    const { pages, text } = inspect(<NdaPdf template={template} data={data} />);
    expect(text.split(DISCLAIMER).length - 1).toBe(pages);
  });

  it("renders a valid PDF that embeds the Unicode font instead of the built-in Times", async () => {
    const pdf = (await renderToBuffer(<NdaPdf template={template} data={data} />)).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toMatch(/\/BaseFont \/[A-Z]{6}\+NotoSerif/);
    expect(pdf).not.toMatch(/\/BaseFont \/Times/);
  }, 30_000);
});
