"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { GREETING, sendChat, type ChatMessage, type ChatResponse, type DocumentState } from "@/lib/chat";

type Props = {
  document: DocumentState;
  onReply: (response: ChatResponse) => void;
};

/** Freeform chat with the AI, which picks the document and fills in its fields from the conversation. */
export function DocumentChat({ document, onReply }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight });
    if (!busy) inputRef.current?.focus();
  }, [messages, busy]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const conversation: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(conversation);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const response = await sendChat(conversation, document);
      setMessages([...conversation, { role: "assistant", content: response.reply }]);
      onReply(response);
    } catch (err) {
      console.error(err);
      setMessages(messages);
      setInput(text);
      setError("The assistant could not reply. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ol ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((message, index) => (
          <li key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === "user" ? "bg-[#209dd7] text-white" : "bg-zinc-100 text-zinc-900"
              }`}
            >
              {message.content}
            </p>
          </li>
        ))}
        {busy && <li className="text-sm text-[#888888]">Assistant is thinking…</li>}
      </ol>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      <form className="mt-4 flex flex-col gap-2" onSubmit={send}>
        <textarea
          ref={inputRef}
          rows={4}
          value={input}
          disabled={busy}
          placeholder="Type your answer…"
          aria-label="Message"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="field-sizing-content max-h-60 min-h-28 w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="self-end rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
