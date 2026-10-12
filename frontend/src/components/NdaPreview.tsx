import {
  coverSections,
  NDA_TITLE,
  PARTY_HEADERS,
  signatureRows,
  SIGNING_STATEMENT,
  STANDARD_TERMS_TITLE,
  type NdaData,
} from "@/lib/nda";
import { refValue, type MndaTemplate, type Segment } from "@/lib/template";
import { Filled, focusClass, SignatureTable } from "./preview-parts";

type Props = { template: MndaTemplate; data: NdaData; focus?: string[] };

/** HTML rendering of the completed Mutual NDA: cover page followed by the Standard Terms. */
export function NdaPreview({ template, data, focus = [] }: Props) {
  return (
    <article className="space-y-6 rounded-lg bg-white p-8 font-serif text-[13px] leading-relaxed text-zinc-900 shadow-md ring-1 ring-zinc-200 sm:p-12">
      <header className="space-y-3">
        <h2 className="text-center text-xl font-bold">{NDA_TITLE}</h2>
        <p>
          <Segments segments={template.coverIntro} data={data} />
        </p>
      </header>

      {coverSections(data).map((section) => (
        <section key={section.heading} className="space-y-1">
          <h3 className="font-bold">{section.heading}</h3>
          {section.lines.map((line, i) => (
            <p key={i} data-field={line.focus} className={`whitespace-pre-line ${focusClass(focus, line.focus)}`}>
              {line.label && <span>{line.label}: </span>}
              <Filled value={line.value} />
            </p>
          ))}
        </section>
      ))}

      <p>{SIGNING_STATEMENT}</p>
      <SignatureTable headers={PARTY_HEADERS} rows={signatureRows(data)} focus={focus} />

      <section className="space-y-3 border-t border-zinc-200 pt-6">
        <h3 className="text-center text-lg font-bold">{STANDARD_TERMS_TITLE}</h3>
        <ol className="space-y-3">
          {template.clauses.map((clause) => (
            <li key={clause.number}>
              {clause.number}. <strong>{clause.title}</strong>.{" "}
              <Segments segments={clause.body} data={data} />
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-600">
        <Segments segments={template.attribution} data={data} />
      </footer>
    </article>
  );
}

function Segments({ segments, data }: { segments: Segment[]; data: NdaData }) {
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
      case "ref": {
        const value = refValue(segment.name, data);
        return value ? (
          <Filled key={i} value={value} />
        ) : (
          <span key={i} className="underline decoration-dotted" title="Defined on the Cover Page">
            {segment.name}
          </span>
        );
      }
    }
  });
}
