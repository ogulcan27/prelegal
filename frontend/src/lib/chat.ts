import { api } from "./api";
import type { DocumentFields } from "./documents";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** The current document as the chat sees it; both null until the AI knows which document the user needs. */
export type DocumentState = { documentType: string | null; fields: DocumentFields | null };

/**
 * `focus` names the fields the reply asks about, so the preview can highlight them.
 * `documentId` is the saved document, null until the AI knows the document type.
 */
export type ChatResponse = DocumentState & { reply: string; focus: string[]; documentId: number | null };

export const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a legal agreement, for example a Mutual NDA, a Cloud Service Agreement or a Pilot Agreement. What do you need?",
};

/** Sends the conversation and the current document to the backend, which replies and saves the document. */
export function sendChat(messages: ChatMessage[], document: DocumentState, documentId: number | null) {
  return api<ChatResponse>("/api/chat", { messages, ...document, documentId });
}
