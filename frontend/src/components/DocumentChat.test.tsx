// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GREETING } from "@/lib/chat";
import { defaultNdaData } from "@/lib/nda";
import { DocumentChat } from "./DocumentChat";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const current = { documentType: "mutual-nda", fields: defaultNdaData };
const reply = {
  reply: "Which courts?",
  documentType: "mutual-nda",
  fields: { ...defaultNdaData, governingLaw: "Delaware" },
  focus: ["jurisdiction"],
};
const onReply = vi.fn();
const fetchMock = vi.fn();
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  container = document.createElement("div");
  document.body.append(container);
  act(() => createRoot(container).render(<DocumentChat document={current} onReply={onReply} />));
});

afterEach(() => {
  container.remove();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  onReply.mockReset();
});

const bubbles = () => [...container.querySelectorAll("li")].map((li) => li.textContent);

const submitForm = () =>
  container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

/** Types `text` into the message box, then sends it (by default, by submitting the form). */
async function sendMessage(text: string, send: (textarea: HTMLTextAreaElement) => void = submitForm) {
  const textarea = container.querySelector("textarea")!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(textarea, text);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => send(textarea));
}

describe("DocumentChat", () => {
  it("starts with the greeting", () => {
    expect(bubbles()).toEqual([GREETING.content]);
  });

  it("sends the conversation and current document, then shows the reply and passes it on", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(reply)));
    await sendMessage("Delaware law");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(init.body)).toEqual({
      messages: [GREETING, { role: "user", content: "Delaware law" }],
      documentType: "mutual-nda",
      fields: defaultNdaData,
    });
    expect(bubbles()).toEqual([GREETING.content, "Delaware law", "Which courts?"]);
    expect(onReply).toHaveBeenCalledWith(reply);
  });

  it("sends on Enter but not on Shift+Enter", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(reply)));
    await sendMessage("Delaware law", (textarea) =>
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    await sendMessage("Delaware law", (textarea) =>
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps the user's text and shows an error when the request fails", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await sendMessage("Delaware law");

    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/could not reply/);
    expect(bubbles()).toEqual([GREETING.content]);
    expect(container.querySelector("textarea")!.value).toBe("Delaware law");
    expect(onReply).not.toHaveBeenCalled();
  });
});
