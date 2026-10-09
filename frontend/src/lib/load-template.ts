import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseMndaTemplate, type MndaTemplate } from "./template";

/** The repo-level templates directory (the Next.js app lives in ./frontend). */
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

/** Reads and parses the Mutual NDA templates. Cached, so they are read once at build time. */
export async function loadMndaTemplate(): Promise<MndaTemplate> {
  "use cache";
  cacheLife("max");
  const [standardTerms, coverPage] = await Promise.all([
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf8"),
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf8"),
  ]);
  return parseMndaTemplate(standardTerms, coverPage);
}
