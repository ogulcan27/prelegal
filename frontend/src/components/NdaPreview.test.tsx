// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaData } from "@/lib/nda";
import { parseMndaTemplate } from "@/lib/template";
import { NdaPreview } from "./NdaPreview";

const template = parseMndaTemplate(
  [
    '9. **Governing Law and Jurisdiction**. The laws of the State of <span class="coverpage_link">Governing Law</span> apply.',
    '10. **Use**. Use only for the <span class="coverpage_link">Purpose</span>.',
    "Common Paper attribution",
  ].join("\n"),
  "This Mutual Non-Disclosure Agreement consists of a Cover Page.",
);

function render(overrides: Partial<NdaData> = {}) {
  const html = renderToStaticMarkup(<NdaPreview template={template} data={{ ...defaultNdaData, ...overrides }} />);
  return new DOMParser().parseFromString(html, "text/html");
}

const clause = (doc: Document, number: number) =>
  [...doc.querySelectorAll("li")].find((li) => li.textContent?.startsWith(`${number}.`))!;

describe("NdaPreview", () => {
  it("highlights empty fields with placeholders", () => {
    const marks = [...render().querySelectorAll("mark")].map((m) => m.textContent);
    expect(marks).toContain("[Governing Law]");
    expect(marks).toContain("[Jurisdiction]");
    expect(marks).toContain("[Effective Date]");
  });

  it("substitutes governing law into the Standard Terms as plain text", () => {
    const doc = render({ governingLaw: "Delaware" });
    const governingLaw = clause(doc, 9);
    expect(governingLaw.textContent).toContain("laws of the State of Delaware apply");
    expect(governingLaw.querySelector("mark")).toBeNull();
  });

  it("keeps defined terms such as Purpose by name", () => {
    const purpose = clause(render({ purpose: "Exploring a partnership." }), 10).querySelector("span[title]");
    expect(purpose?.textContent).toBe("Purpose");
    expect(purpose?.getAttribute("title")).toBe("Defined on the Cover Page");
  });

  it("shows party details and leaves signature and date cells blank", () => {
    const parties: NdaData["parties"] = [
      { name: "Oğulcan Özer", title: "Founder", company: "Özer A.Ş.", noticeAddress: "İstanbul" },
      { name: "Bob", title: "CTO", company: "Globex", noticeAddress: "bob@globex.test" },
    ];
    const rows = [...render({ parties }).querySelectorAll("tbody tr")];
    const cells = (label: string) =>
      [...rows.find((r) => r.querySelector("th")?.textContent === label)!.querySelectorAll("td")].map(
        (td) => td.textContent,
      );
    expect(cells("Print Name")).toEqual(["Oğulcan Özer", "Bob"]);
    expect(cells("Company")).toEqual(["Özer A.Ş.", "Globex"]);
    expect(cells("Signature")).toEqual(["", ""]);
    expect(cells("Date")).toEqual(["", ""]);
  });
});
