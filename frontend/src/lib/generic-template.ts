/**
 * Parses the Common Paper standard-terms markdown (every template except the Mutual NDA)
 * into numbered blocks that both the HTML preview and the PDF renderer can draw.
 */

export type GenericSegment =
  | { kind: "text"; text: string; bold?: boolean }
  | { kind: "link"; text: string; href: string }
  /** A defined term filled in on the cover page, e.g. <span class="orderform_link">Subscription Period</span>. */
  | { kind: "ref"; label: string };

export type Block = {
  /** Nesting level: 0 for "1.", 1 for "1.1", 2 for "a.", ... */
  depth: number;
  /** List marker as written in the template, e.g. "1." or "a.". Empty for plain paragraphs. */
  marker: string;
  heading?: string;
  body: GenericSegment[];
};

export type GenericTemplate = { title: string; blocks: Block[] };

const ITEM = /^(\s*)(?:(\d+|[a-z]+)\.\s+)?(.*)$/;
const HEADING = /^<span class="header_\d"[^>]*>(.+?)<\/span>\s*/;
const INLINE =
  /\*\*(.+?)\*\*|<span class="[a-z]+_link"[^>]*>(.+?)<\/span>|\[(.+?)\]\((.+?)\)|<(https?:\/\/[^>]+)>/g;

/** Removes anchor spans such as <span id="4.7"></span> or <span id="5.3.a">if</span>, keeping their text. */
const stripAnchors = (s: string) => s.replace(/<span id="[^"]*">([^<]*)<\/span>/g, "$1");

export function parseGenericInline(markdown: string): GenericSegment[] {
  const segments: GenericSegment[] = [];
  let last = 0;
  for (const match of markdown.matchAll(INLINE)) {
    if (match.index > last) segments.push({ kind: "text", text: markdown.slice(last, match.index) });
    const [, bold, ref, linkText, href, autolink] = match;
    if (bold !== undefined) segments.push(...parseGenericInline(bold).map((s) => (s.kind === "text" ? { ...s, bold: true } : s)));
    else if (ref !== undefined) segments.push({ kind: "ref", label: ref });
    else if (autolink !== undefined) segments.push({ kind: "link", text: autolink, href: autolink });
    else segments.push({ kind: "link", text: linkText, href });
    last = match.index + match[0].length;
  }
  if (last < markdown.length) segments.push({ kind: "text", text: markdown.slice(last) });
  return segments;
}

export function parseGenericTemplate(markdown: string): GenericTemplate {
  let title = "";
  const blocks: Block[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }
    const [, indent, marker, rest] = ITEM.exec(line)!;
    let content = stripAnchors(rest.trim());
    const heading = HEADING.exec(content);
    if (heading) content = content.slice(heading[0].length);
    blocks.push({
      depth: Math.floor(indent.length / 4),
      marker: marker ? `${marker}.` : "",
      heading: heading?.[1],
      body: parseGenericInline(content),
    });
  }
  if (!title || blocks.length === 0) throw new Error("Template is not in the expected Common Paper format");
  return { title, blocks };
}
