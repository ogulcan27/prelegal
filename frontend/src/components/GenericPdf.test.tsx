import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import type { DocumentInfo, GenericData } from "@/lib/documents";
import { parseGenericTemplate } from "@/lib/generic-template";
import { GenericPdf } from "./GenericPdf";
import { registerPdfFonts } from "./pdf-parts";
import { inspectPdf } from "./pdf-inspect";

const root = path.resolve(import.meta.dirname, "../..");
const repo = path.resolve(root, "..");
registerPdfFonts((file) => path.join(root, "public/fonts", file));

const catalog: DocumentInfo[] = JSON.parse(readFileSync(path.join(repo, "documents.json"), "utf8")).documents;
const info = catalog.find((doc) => doc.id === "cloud-service-agreement")!;
const doc = { ...info, standardTerms: parseGenericTemplate(readFileSync(path.join(repo, "templates", info.template), "utf8")) };

const party = { name: "", title: "", company: "", noticeAddress: "" };
const data: GenericData = {
  parties: [{ ...party, company: "Özer Bulut A.Ş." }, { ...party, company: "Globex" }],
  terms: { ...Object.fromEntries(info.terms.map((term) => [term.key, ""])), governingLaw: "Delaware" },
};

describe("GenericPdf", () => {
  it("contains the cover page, key terms with placeholders and the Standard Terms", () => {
    const { pages, text } = inspectPdf(<GenericPdf doc={doc} data={data} />);
    expect(pages).toBe(2);
    expect(text).toContain("Cloud Service Agreement");
    expect(text).toContain("Governing LawDelaware");
    expect(text).toContain("[Subscription Period]");
    expect(text).toContain("Özer Bulut A.Ş.");
    expect(text).toContain("1. Access and Use.");
    expect(text).toContain("CC BY 4.0");
  });

  it("renders a valid PDF with the Unicode font", async () => {
    const pdf = (await renderToBuffer(<GenericPdf doc={doc} data={data} />)).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toMatch(/\/BaseFont \/[A-Z]{6}\+NotoSerif/);
  }, 30_000);
});
