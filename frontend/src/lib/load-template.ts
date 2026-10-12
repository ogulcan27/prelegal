import { readFile } from "node:fs/promises";
import path from "node:path";
import { NDA_ID, type DocumentInfo, type GenericDocument } from "./documents";
import { parseGenericTemplate } from "./generic-template";
import { parseMndaTemplate, type MndaTemplate } from "./template";

/** The repository root (the Next.js app lives in ./frontend). */
const REPO_DIR = path.join(process.cwd(), "..");
const TEMPLATES_DIR = path.join(REPO_DIR, "templates");

const readTemplate = (file: string) => readFile(path.join(TEMPLATES_DIR, file), "utf8");

/** Reads and parses the Mutual NDA templates. Runs once at build time (static export). */
export async function loadMndaTemplate(): Promise<MndaTemplate> {
  const [standardTerms, coverPage] = await Promise.all([
    readTemplate("Mutual-NDA.md"),
    readTemplate("Mutual-NDA-coverpage.md"),
  ]);
  return parseMndaTemplate(standardTerms, coverPage);
}

/** Reads documents.json and parses the standard terms of every document except the NDA. Runs at build time. */
export async function loadGenericDocuments(): Promise<GenericDocument[]> {
  const catalog: { documents: DocumentInfo[] } = JSON.parse(await readFile(path.join(REPO_DIR, "documents.json"), "utf8"));
  return Promise.all(
    catalog.documents
      .filter((doc) => doc.id !== NDA_ID)
      .map(async (doc) => ({ ...doc, standardTerms: parseGenericTemplate(await readTemplate(doc.template)) })),
  );
}
