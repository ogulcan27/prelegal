import { readFileSync } from "node:fs";
import path from "node:path";
import { Page, renderToBuffer } from "@react-pdf/renderer";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaData } from "@/lib/nda";
import { parseMndaTemplate } from "@/lib/template";
import { NdaPdf, registerPdfFonts } from "./NdaPdf";

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

/**
 * Walks the react-pdf element tree, expanding our own function components, and collects
 * its text and its Page elements. This checks what the PDF says without decoding the PDF file.
 */
function inspect(node: ReactNode, found = { text: [] as string[], pages: 0 }) {
  if (typeof node === "string" || typeof node === "number") found.text.push(String(node));
  else if (Array.isArray(node)) node.forEach((child) => inspect(child, found));
  else if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    if (element.type === Page) found.pages++;
    if (typeof element.type === "function") {
      inspect((element.type as (props: object) => ReactNode)(element.props), found);
    } else inspect(element.props.children, found);
  }
  return { pages: found.pages, text: found.text.join("") };
}

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

  it("renders a valid PDF that embeds the Unicode font instead of the built-in Times", async () => {
    const pdf = (await renderToBuffer(<NdaPdf template={template} data={data} />)).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toMatch(/\/BaseFont \/[A-Z]{6}\+NotoSerif/);
    expect(pdf).not.toMatch(/\/BaseFont \/Times/);
  }, 30_000);
});
