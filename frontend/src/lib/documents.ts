/**
 * Document catalog (repo-level documents.json) and the field model shared by every
 * document except the Mutual NDA, which keeps its own model in nda.ts.
 */

import type { NdaData, Party } from "./nda";
import type { GenericTemplate } from "./generic-template";

export const NDA_ID = "mutual-nda";

export type Term = { key: string; label: string; hint: string };

export type DocumentInfo = {
  id: string;
  name: string;
  description: string;
  template: string;
  /** Role names of the two parties, e.g. ["Provider", "Customer"]. */
  parties: [string, string];
  terms: Term[];
};

/** A non-NDA document with its parsed standard terms. */
export type GenericDocument = DocumentInfo & { standardTerms: GenericTemplate };

export type GenericData = { parties: [Party, Party]; terms: Record<string, string> };

export type DocumentFields = NdaData | GenericData;

/** Focus keys for the two parties; the other focus keys are term keys (or NDA section keys). */
export const PARTY_FOCUS_KEYS = ["party1", "party2"] as const;

/** The focus key a template reference points to, e.g. "Customer's" -> "party2", "Subscription Periods" -> "subscriptionPeriod". */
export function focusKeyForLabel(doc: DocumentInfo, label: string): string | undefined {
  const base = label.replace(/['’]s$/, "");
  const candidates = [base, `${base}s`, base.replace(/s$/, "")];
  const party = doc.parties.findIndex((role) => candidates.includes(role));
  if (party >= 0) return PARTY_FOCUS_KEYS[party];
  return doc.terms.find((term) => candidates.includes(term.label))?.key;
}

/** Cover page texts of the generated (non-NDA) documents, shared by the HTML preview and the PDF. */
export const coverIntro = (name: string) =>
  `This ${name} consists of this Cover Page, which records the parties and the Key Terms, and the Standard Terms that follow.`;

export const GENERIC_SIGNING_STATEMENT =
  "By signing this Cover Page, each party agrees to enter into this Agreement as of the Effective Date.";

export const attribution = (name: string) => `Based on the Common Paper ${name} standard terms, free to use under CC BY 4.0.`;

/** File name for the download, e.g. "Cloud-Service-Agreement-Acme-Globex.pdf". */
export function documentFileName(name: string, parties: Party[]): string {
  const slug = (s: string) => s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return [slug(name), ...parties.map((p) => slug(p.company)).filter(Boolean)].join("-") + ".pdf";
}
