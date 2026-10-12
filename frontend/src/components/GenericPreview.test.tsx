// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenericData, GenericDocument } from "@/lib/documents";
import { parseGenericTemplate } from "@/lib/generic-template";
import { GenericPreview } from "./GenericPreview";

const doc: GenericDocument = {
  id: "pilot-agreement",
  name: "Pilot Agreement",
  description: "",
  template: "Pilot-Agreement.md",
  parties: ["Provider", "Customer"],
  terms: [
    { key: "pilotPeriod", label: "Pilot Period", hint: "" },
    { key: "governingLaw", label: "Governing Law", hint: "" },
  ],
  standardTerms: parseGenericTemplate(
    [
      "# Pilot Agreement",
      '1. <span class="header_2">Pilot</span>',
      '    1. <span class="header_3">Access.</span> During the <span class="orderform_link">Pilot Period</span>, <span class="orderform_link">Customer\'s</span> users may test.',
    ].join("\n"),
  ),
};

const party = { name: "", title: "", company: "", noticeAddress: "" };
const data: GenericData = {
  parties: [{ ...party, company: "Acme Inc" }, party],
  terms: { pilotPeriod: "90 days", governingLaw: "" },
};

function render(focus: string[] = []) {
  const html = renderToStaticMarkup(<GenericPreview doc={doc} data={data} focus={focus} />);
  return new DOMParser().parseFromString(html, "text/html");
}

const highlighted = (page: Document) => [...page.querySelectorAll(".ring-2")].map((el) => el.textContent);

describe("GenericPreview", () => {
  it("shows the title, key terms with placeholders, parties and standard terms", () => {
    const page = render();
    expect(page.querySelector("h2")?.textContent).toBe("Pilot Agreement");
    expect(page.querySelector('[data-field="pilotPeriod"]')?.textContent).toBe("Pilot Period90 days");
    expect(page.querySelector('[data-field="governingLaw"] mark')?.textContent).toBe("[Governing Law]");
    expect([...page.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["", "PROVIDER", "CUSTOMER"]);
    expect(page.body.textContent).toContain("Acme Inc");
    expect(page.body.textContent).toContain("1. Access. During the Pilot Period, Customer's users may test.");
  });

  it("highlights nothing without focus", () => {
    expect(highlighted(render())).toEqual([]);
  });

  it("highlights the focused key term and its references in the text", () => {
    expect(highlighted(render(["pilotPeriod"]))).toEqual(["Pilot Period90 days", "Pilot Period"]);
  });

  it("highlights a focused party's column and its references", () => {
    const page = render(["party2"]);
    expect(page.querySelector('thead [data-field="party2"]')?.className).toContain("ring-2");
    expect(highlighted(page)).toContain("Customer's");
    expect(highlighted(page)).not.toContain("Acme Inc");
  });
});
