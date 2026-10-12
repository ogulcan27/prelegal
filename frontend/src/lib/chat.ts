import type { DocumentFields } from "./documents";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** The current document as the chat sees it; both null until the AI knows which document the user needs. */
export type DocumentState = { documentType: string | null; fields: DocumentFields | null };

/** `focus` names the fields the reply asks about, so the preview can highlight them. */
export type ChatResponse = DocumentState & { reply: string; focus: string[] };

export const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a legal agreement, for example a Mutual NDA, a Cloud Service Agreement or a Pilot Agreement. What do you need?",
};

/** Sends the conversation and the current document to the backend; returns the AI reply and the updated document. */
export async function sendChat(messages: ChatMessage[], document: DocumentState): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, ...document }),
  });
  if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
  return response.json();
}
