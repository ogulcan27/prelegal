// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { json, mount } from "@/test-utils";
import { DocumentList } from "./DocumentList";

const fetchMock = vi.fn();

function render(response: Response) {
  fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return mount(<DocumentList />);
}

describe("DocumentList", () => {
  it("links each saved document to the editor", async () => {
    const container = await render(
      json([
        { id: 2, title: "Pilot Agreement - Globex", documentType: "pilot-agreement", updatedAt: "2026-10-12T10:00:00Z" },
        { id: 1, title: "Mutual Non-Disclosure Agreement", documentType: "mutual-nda", updatedAt: "2026-10-11T09:00:00Z" },
      ]),
    );
    expect(fetchMock.mock.calls[0][0]).toBe("/api/documents");
    const links = [...container.querySelectorAll("a")];
    // Outside the app build, Next drops the trailing slash that `trailingSlash: true` keeps.
    expect(links.map((a) => a.getAttribute("href")?.replace("/editor/", "/editor"))).toEqual(["/editor?id=2", "/editor?id=1"]);
    expect(links[0].textContent).toContain("Pilot Agreement - Globex");
  });

  it("explains the empty list", async () => {
    expect((await render(json([]))).textContent).toContain("No documents yet");
  });

  it("shows an error when the list cannot be loaded", async () => {
    const container = await render(new Response("boom", { status: 500 }));
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
