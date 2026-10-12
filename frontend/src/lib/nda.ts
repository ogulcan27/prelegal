/**
 * Mutual NDA data model and the cover-page text derived from it.
 *
 * The wording mirrors templates/Mutual-NDA-coverpage.md (Common Paper Mutual NDA v1.0).
 * Both the HTML preview and the PDF render from these helpers so they never drift apart.
 */

export type Party = {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type NdaData = {
  purpose: string;
  /** ISO date (YYYY-MM-DD), or empty when not chosen yet. */
  effectiveDate: string;
  mndaTermType: "expires" | "continuous";
  mndaTermYears: number;
  confidentialityType: "years" | "perpetual";
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  parties: [Party, Party];
};

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export const defaultNdaData: NdaData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityType: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  parties: [emptyParty, emptyParty],
};

/** A piece of document text: either filled in by the user or a bracketed placeholder. */
export type Value = { text: string; missing: boolean };

const filled = (text: string): Value => ({ text, missing: false });
const missing = (placeholder: string): Value => ({ text: `[${placeholder}]`, missing: true });

export function valueOr(text: string, placeholder: string): Value {
  const trimmed = text.trim();
  return trimmed ? filled(trimmed) : missing(placeholder);
}

/** Today's date in the user's local time zone, as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDate(iso: string): Value {
  const date = new Date(`${iso}T00:00:00Z`);
  if (!iso || Number.isNaN(date.getTime())) return missing("Effective Date");
  const text = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return filled(text);
}

function years(n: number): string | null {
  return Number.isInteger(n) && n > 0 ? `${n} year(s)` : null;
}

export function mndaTermText(data: NdaData): Value {
  if (data.mndaTermType === "continuous") {
    return filled("Continues until terminated in accordance with the terms of the MNDA.");
  }
  const span = years(data.mndaTermYears);
  return span ? filled(`Expires ${span} from Effective Date.`) : missing("MNDA Term");
}

export function confidentialityText(data: NdaData): Value {
  if (data.confidentialityType === "perpetual") return filled("In perpetuity.");
  const span = years(data.confidentialityYears);
  return span
    ? filled(
        `${span} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      )
    : missing("Term of Confidentiality");
}

/** `focus` is the key the AI chat uses when it asks about this line (see backend NDA_FOCUS_KEYS). */
export type CoverSection = { heading: string; lines: { label?: string; value: Value; focus: string }[] };

export function coverSections(data: NdaData): CoverSection[] {
  return [
    { heading: "Purpose", lines: [{ value: valueOr(data.purpose, "Purpose"), focus: "purpose" }] },
    { heading: "Effective Date", lines: [{ value: formatDate(data.effectiveDate), focus: "effectiveDate" }] },
    { heading: "MNDA Term", lines: [{ value: mndaTermText(data), focus: "mndaTerm" }] },
    { heading: "Term of Confidentiality", lines: [{ value: confidentialityText(data), focus: "confidentiality" }] },
    {
      heading: "Governing Law & Jurisdiction",
      lines: [
        { label: "Governing Law", value: valueOr(data.governingLaw, "Governing Law"), focus: "governingLaw" },
        { label: "Jurisdiction", value: valueOr(data.jurisdiction, "Jurisdiction"), focus: "jurisdiction" },
      ],
    },
    {
      heading: "MNDA Modifications",
      lines: [{ value: filled(data.modifications.trim() || "None."), focus: "modifications" }],
    },
  ];
}

export const NDA_TITLE = "Mutual Non-Disclosure Agreement";
export const STANDARD_TERMS_TITLE = "Standard Terms";
export const PARTY_HEADERS = ["PARTY 1", "PARTY 2"] as const;
export const SIGNING_STATEMENT =
  "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.";

/** A signature-table row. `toSign` rows (Signature, Date) are left blank for signing by hand. */
export type SignatureRow = { label: string; values: [string, string]; toSign?: boolean };

export function signatureRows(data: { parties: [Party, Party] }): SignatureRow[] {
  const [first, second] = data.parties;
  const row = (label: string, key: keyof Party): SignatureRow => ({
    label,
    values: [first[key].trim(), second[key].trim()],
  });
  return [
    { label: "Signature", values: ["", ""], toSign: true },
    row("Print Name", "name"),
    row("Title", "title"),
    row("Company", "company"),
    row("Notice Address", "noticeAddress"),
    { label: "Date", values: ["", ""], toSign: true },
  ];
}

/** File name for the download, e.g. "Mutual-NDA-Acme-Globex.pdf". */
export function pdfFileName(data: NdaData): string {
  const slug = (s: string) => s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const companies = data.parties.map((p) => slug(p.company)).filter(Boolean);
  return ["Mutual-NDA", ...companies].join("-") + ".pdf";
}
