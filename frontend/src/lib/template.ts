/**
 * Parses the Common Paper Mutual NDA markdown templates into a small document model
 * that both the HTML preview and the PDF renderer can draw.
 */

import { valueOr, type NdaData, type Value } from "./nda";

export type Segment =
  | { kind: "text"; text: string; bold?: boolean }
  | { kind: "link"; text: string; href: string }
  /** A reference to a cover-page field, e.g. <span class="coverpage_link">Purpose</span>. */
  | { kind: "ref"; name: RefName };

export type Clause = { number: number; title: string; body: Segment[] };

export type MndaTemplate = {
  /** "This Mutual Non-Disclosure Agreement ... consists of ..." paragraph from the cover page. */
  coverIntro: Segment[];
  /** Numbered Standard Terms clauses. */
  clauses: Clause[];
  /** Common Paper CC BY 4.0 attribution line. */
  attribution: Segment[];
};

const REF_NAMES = [
  "Purpose",
  "Effective Date",
  "MNDA Term",
  "Term of Confidentiality",
  "Governing Law",
  "Jurisdiction",
] as const;
export type RefName = (typeof REF_NAMES)[number];

const INLINE = /\*\*(.+?)\*\*|<span class="coverpage_link">(.+?)<\/span>|\[(.+?)\]\((.+?)\)/g;

export function parseInline(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of markdown.matchAll(INLINE)) {
    if (match.index > last) segments.push({ kind: "text", text: markdown.slice(last, match.index) });
    const [, bold, ref, linkText, href] = match;
    if (bold !== undefined) segments.push({ kind: "text", text: bold, bold: true });
    else if (ref !== undefined) segments.push({ kind: "ref", name: toRefName(ref) });
    else segments.push({ kind: "link", text: linkText, href });
    last = match.index + match[0].length;
  }
  if (last < markdown.length) segments.push({ kind: "text", text: markdown.slice(last) });
  return segments;
}

function toRefName(name: string): RefName {
  if ((REF_NAMES as readonly string[]).includes(name)) return name as RefName;
  throw new Error(`Unknown cover page reference in template: "${name}"`);
}

const CLAUSE = /^(\d+)\.\s+\*\*(.+?)\*\*\.\s+(.*)$/;

export function parseMndaTemplate(standardTerms: string, coverPage: string): MndaTemplate {
  const termLines = standardTerms.split(/\r?\n/).map((line) => line.trim());

  const clauses = termLines.flatMap((line) => {
    const match = CLAUSE.exec(line);
    return match ? [{ number: Number(match[1]), title: match[2], body: parseInline(match[3]) }] : [];
  });
  const attribution = termLines.find((line) => line.startsWith("Common Paper"));
  const coverIntro = coverPage
    .split(/\r?\n/)
    .find((line) => line.startsWith("This Mutual Non-Disclosure Agreement"));

  if (clauses.length === 0 || !attribution || !coverIntro) {
    throw new Error("Mutual NDA templates are not in the expected Common Paper format");
  }
  return { coverIntro: parseInline(coverIntro), clauses, attribution: parseInline(attribution) };
}

/**
 * The user's value for a cover-page reference inside the Standard Terms, or null to keep its name.
 *
 * Governing Law and Jurisdiction read naturally with the value substituted
 * ("the laws of the State of Delaware"). The other references are defined terms
 * ("solely for the Purpose") and keep their name; their values appear on the cover page.
 */
export function refValue(name: RefName, data: NdaData): Value | null {
  if (name === "Governing Law") return valueOr(data.governingLaw, name);
  if (name === "Jurisdiction") return valueOr(data.jurisdiction, name);
  return null;
}
