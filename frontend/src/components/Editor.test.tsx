// @vitest-environment happy-dom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { GREETING } from "@/lib/chat";
import { DISCLAIMER, type GenericDocument } from "@/lib/documents";
import { loadGenericDocuments, loadMndaTemplate } from "@/lib/load-template";
import type { MndaTemplate } from "@/lib/template";
import { json, mount, typeAndSend } from "@/test-utils";
import { Editor } from "./Editor";

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

const party = { name: "", title: "", company: "", noticeAddress: "" };
const fields = {
  parties: [party, { ...party, company: "Globex" }],
  terms: { effectiveDate: "", pilotPeriod: "90 days", generalCapAmount: "", governingLaw: "", chosenCourts: "" },
};
const saved = {
  id: 3,
  title: "Pilot Agreement - Globex",
  documentType: "pilot-agreement",
  updatedAt: "2026-10-12T10:00:00Z",
  fields,
  messages: [GREETING, { role: "user", content: "A pilot with Globex" }, { role: "assistant", content: "Who is the provider?" }],
};

const fetchMock = vi.fn();
let ndaTemplate: MndaTemplate;
let documents: GenericDocument[];

beforeAll(async () => {
  [ndaTemplate, documents] = await Promise.all([loadMndaTemplate(), loadGenericDocuments()]);
});

function open(query: string) {
  searchParams = new URLSearchParams(query);
  vi.stubGlobal("fetch", fetchMock);
  return mount(<Editor ndaTemplate={ndaTemplate} documents={documents} />);
}

const bubbles = (container: HTMLElement) => [...container.querySelectorAll("ol > li")].map((li) => li.textContent);

const turn = (documentId: number) => json({ reply: "Thanks.", documentType: "pilot-agreement", fields, focus: [], documentId });

describe("Editor", () => {
  it("reopens a saved document with its chat and preview, and keeps saving to it", async () => {
    fetchMock.mockResolvedValueOnce(json(saved));
    const container = await open("id=3");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/documents/3");
    expect(bubbles(container)).toEqual([GREETING.content, "A pilot with Globex", "Who is the provider?"]);
    expect(container.querySelector('[data-field="pilotPeriod"]')?.textContent).toContain("90 days");
    expect(container.textContent).toContain(DISCLAIMER);

    fetchMock.mockResolvedValueOnce(turn(3));
    await typeAndSend(container, "Acme is the provider");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).documentId).toBe(3);
  });

  it("starts a new document and puts its id in the address once saved", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const container = await open("");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(bubbles(container)).toEqual([GREETING.content]);

    fetchMock.mockResolvedValueOnce(turn(9));
    await typeAndSend(container, "A pilot agreement");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).documentId).toBeNull();
    expect(replaceState).toHaveBeenCalledWith(null, "", "?id=9");
  });

  it("says when the document cannot be found", async () => {
    fetchMock.mockResolvedValueOnce(json({ detail: "Document not found." }, 404));
    expect((await open("id=99")).textContent).toContain("Document not found");
  });
});
