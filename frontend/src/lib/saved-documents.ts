import { api } from "./api";
import type { ChatMessage } from "./chat";
import type { DocumentFields } from "./documents";

/** A document as listed on the My documents page; `updatedAt` is an ISO UTC time. */
export type DocumentSummary = { id: number; title: string; documentType: string; updatedAt: string };

export type SavedDocument = DocumentSummary & { fields: DocumentFields; messages: ChatMessage[] };

export const listDocuments = () => api<DocumentSummary[]>("/api/documents");
export const getDocument = (id: number) => api<SavedDocument>(`/api/documents/${id}`);
