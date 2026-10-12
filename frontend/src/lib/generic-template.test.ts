import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { focusKeyForLabel, type DocumentInfo } from "./documents";
import { parseGenericInline, parseGenericTemplate } from "./generic-template";

const repo = path.resolve(import.meta.dirname, "../../..");
const catalog: DocumentInfo[] = JSON.parse(readFileSync(path.join(repo, "documents.json"), "utf8")).documents;
const generic = catalog.filter((doc) => doc.id !== "mutual-nda");

describe("parseGenericTemplate", () => {
  const csa = parseGenericTemplate(
    [
      "# Cloud Service Agreement",
      "",
      '1. <span class="header_2" id="1">Service</span>',
      '    1. <span class="header_3" id="1.1">Access and Use.</span>  During the <span class="orderform_link">Subscription Period</span>, **Customer** may use it.',
      '        a. <span id="5.3.a">if</span> notice is given <https://example.com>.',
    ].join("\n"),
  );

  it("reads the title, nesting, markers and headings", () => {
    expect(csa.title).toBe("Cloud Service Agreement");
    expect(csa.blocks.map((b) => [b.depth, b.marker, b.heading])).toEqual([
      [0, "1.", "Service"],
      [1, "1.", "Access and Use."],
      [2, "a.", undefined],
    ]);
  });

  it("turns cover-page links into references and keeps anchor text", () => {
    expect(csa.blocks[1].body).toEqual([
      { kind: "text", text: "During the " },
      { kind: "ref", label: "Subscription Period" },
      { kind: "text", text: ", " },
      { kind: "text", text: "Customer", bold: true },
      { kind: "text", text: " may use it." },
    ]);
    expect(csa.blocks[2].body).toEqual([
      { kind: "text", text: "if notice is given " },
      { kind: "link", text: "https://example.com", href: "https://example.com" },
      { kind: "text", text: "." },
    ]);
  });

  it.each(generic.map((doc) => [doc.id, doc] as const))("parses templates/%s without leftover HTML", (_, doc) => {
    const template = parseGenericTemplate(readFileSync(path.join(repo, "templates", doc.template), "utf8"));
    expect(template.title).toBeTruthy();
    const text = template.blocks.flatMap((b) => [b.heading ?? "", ...b.body.map((s) => ("text" in s ? s.text : ""))]);
    expect(text.join(" ")).not.toMatch(/<\/?span|<label/);
  });
});

describe("parseGenericInline", () => {
  it("keeps references inside bold text", () => {
    expect(parseGenericInline('**capped at the <span class="keyterms_link">General Cap Amount</span>.**')).toEqual([
      { kind: "text", text: "capped at the ", bold: true },
      { kind: "ref", label: "General Cap Amount" },
      { kind: "text", text: ".", bold: true },
    ]);
  });

  it("parses markdown links", () => {
    expect(parseGenericInline("see [CC BY 4.0](https://x.org)")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "CC BY 4.0", href: "https://x.org" },
    ]);
  });
});

describe("focusKeyForLabel", () => {
  const csa = catalog.find((doc) => doc.id === "cloud-service-agreement")!;

  it("maps party roles, possessives and plurals", () => {
    expect(focusKeyForLabel(csa, "Provider")).toBe("party1");
    expect(focusKeyForLabel(csa, "Customer’s")).toBe("party2");
    expect(focusKeyForLabel(csa, "Subscription Periods")).toBe("subscriptionPeriod");
    expect(focusKeyForLabel(csa, "Provider Covered Claim")).toBe("providerCoveredClaims");
    expect(focusKeyForLabel(csa, "Something Else")).toBeUndefined();
  });

  it.each(generic.map((doc) => [doc.id, doc] as const))("every reference in templates/%s is known", (_, doc) => {
    const template = parseGenericTemplate(readFileSync(path.join(repo, "templates", doc.template), "utf8"));
    const labels = template.blocks.flatMap((b) => b.body.flatMap((s) => (s.kind === "ref" ? [s.label] : [])));
    const unknown = labels.filter((label) => label !== "Notice Address" && !focusKeyForLabel(doc, label));
    expect(unknown).toEqual([]);
  });
});
