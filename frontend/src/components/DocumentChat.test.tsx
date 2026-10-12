// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { GREETING, type ChatMessage } from "@/lib/chat";
import { defaultNdaData } from "@/lib/nda";
import { json, mount, typeAndSend } from "@/test-utils";
import { DocumentChat } from "./DocumentChat";

const current = { documentType: "mutual-nda", fields: defaultNdaData };
const reply = {
  reply: "Which courts?",
  documentType: "mutual-nda",
  fields: { ...defaultNdaData, governingLaw: "Delaware" },
  focus: ["jurisdiction"],
  documentId: 7,
};
const onReply = vi.fn();
const fetchMock = vi.fn();

function render(initialMessages?: ChatMessage[]) {
  vi.stubGlobal("fetch", fetchMock);
  return mount(<DocumentChat document={current} documentId={7} initialMessages={initialMessages} onReply={onReply} />);
}

const bubbles = (container: HTMLElement) => [...container.querySelectorAll("li")].map((li) => li.textContent);

describe("DocumentChat", () => {
  it("starts with the greeting", async () => {
    expect(bubbles(await render())).toEqual([GREETING.content]);
  });

  it("continues a saved conversation", async () => {
    const saved: ChatMessage[] = [GREETING, { role: "user", content: "An NDA" }, { role: "assistant", content: "Sure." }];
    expect(bubbles(await render(saved))).toEqual([GREETING.content, "An NDA", "Sure."]);
  });

  it("sends the conversation, current document and its id, then shows the reply and passes it on", async () => {
    fetchMock.mockResolvedValue(json(reply));
    const container = await render();
    await typeAndSend(container, "Delaware law");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(init.body)).toEqual({
      messages: [GREETING, { role: "user", content: "Delaware law" }],
      documentType: "mutual-nda",
      fields: defaultNdaData,
      documentId: 7,
    });
    expect(bubbles(container)).toEqual([GREETING.content, "Delaware law", "Which courts?"]);
    expect(onReply).toHaveBeenCalledWith(reply);
  });

  it("sends on Enter but not on Shift+Enter", async () => {
    fetchMock.mockResolvedValue(json(reply));
    const container = await render();
    await typeAndSend(container, "Delaware law", (textarea) =>
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    await typeAndSend(container, "Delaware law", (textarea) =>
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps the user's text and shows an error when the request fails", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const container = await render();
    await typeAndSend(container, "Delaware law");

    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/could not reply/);
    expect(bubbles(container)).toEqual([GREETING.content]);
    expect(container.querySelector("textarea")!.value).toBe("Delaware law");
    expect(onReply).not.toHaveBeenCalled();
  });
});
