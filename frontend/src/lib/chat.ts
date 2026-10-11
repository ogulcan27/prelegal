import type { NdaData } from "./nda";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatReply = { reply: string; fields: NdaData };

export const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you prepare a Mutual Non-Disclosure Agreement. To start, which two companies is the NDA between, and why will you share confidential information?",
};

/** Sends the conversation and current fields to the backend; returns the AI reply and updated fields. */
export async function sendChat(messages: ChatMessage[], fields: NdaData): Promise<ChatReply> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, fields }),
  });
  if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
  return response.json();
}
