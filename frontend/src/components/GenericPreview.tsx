import {
  attribution,
  coverIntro,
  focusKeyForLabel,
  GENERIC_SIGNING_STATEMENT,
  type GenericData,
  type GenericDocument,
} from "@/lib/documents";
import type { GenericSegment } from "@/lib/generic-template";
import { signatureRows, valueOr } from "@/lib/nda";
import { Filled, focusClass, SignatureTable } from "./preview-parts";

type Props = { doc: GenericDocument; data: GenericData; focus: string[] };

/** HTML rendering of any non-NDA document: generated cover page (parties, Key Terms) followed by the Standard Terms. */
export function GenericPreview({ doc, data, focus }: Props) {
  return (
    <article className="space-y-6 rounded-lg bg-white p-8 font-serif text-[13px] leading-relaxed text-zinc-900 shadow-md ring-1 ring-zinc-200 sm:p-12">
      <header className="space-y-3">
        <h2 className="text-center text-xl font-bold">{doc.name}</h2>
        <p>{coverIntro(doc.name)}</p>
      </header>

      <section className="space-y-2">
        <h3 className="font-bold">Key Terms</h3>
        <dl className="space-y-1">
          {doc.terms.map((term) => (
            <div key={term.key} data-field={term.key} className={`grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 ${focusClass(focus, term.key)}`}>
              <dt className="font-semibold">{term.label}</dt>
              <dd>
                <Filled value={valueOr(data.terms[term.key], term.label)} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p>{GENERIC_SIGNING_STATEMENT}</p>
      <SignatureTable headers={doc.parties.map((role) => role.toUpperCase())} rows={signatureRows(data)} focus={focus} />

      <section className="space-y-2 border-t border-zinc-200 pt-6">
        <h3 className="text-center text-lg font-bold">Standard Terms</h3>
        {doc.standardTerms.blocks.map((block, i) => (
          <p key={i} style={{ marginLeft: `${block.depth * 1.25}rem` }}>
            {block.marker && `${block.marker} `}
            {block.heading && <strong>{block.heading} </strong>}
            <Segments doc={doc} segments={block.body} focus={focus} />
          </p>
        ))}
      </section>

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-600">
        {attribution(doc.name)}{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" className="text-primary underline" target="_blank" rel="noreferrer">
          License
        </a>
      </footer>
    </article>
  );
}

function Segments({ doc, segments, focus }: { doc: GenericDocument; segments: GenericSegment[]; focus: string[] }) {
  return segments.map((segment, i) => {
    switch (segment.kind) {
      case "text":
        return segment.bold ? <strong key={i}>{segment.text}</strong> : segment.text;
      case "link":
        return (
          <a key={i} href={segment.href} className="text-primary underline" target="_blank" rel="noreferrer">
            {segment.text}
          </a>
        );
      case "ref":
        return (
          <span key={i} className={`underline decoration-dotted ${focusClass(focus, focusKeyForLabel(doc, segment.label))}`} title="Defined on the Cover Page">
            {segment.label}
          </span>
        );
    }
  });
}
