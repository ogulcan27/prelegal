"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatResponse, DocumentState } from "@/lib/chat";
import { documentFileName, NDA_ID, type GenericData, type GenericDocument } from "@/lib/documents";
import { NDA_TITLE, pdfFileName, type NdaData } from "@/lib/nda";
import type { MndaTemplate } from "@/lib/template";
import { DocumentChat } from "./DocumentChat";
import { DownloadButton } from "./DownloadButton";
import { GenericPreview } from "./GenericPreview";
import { NdaPreview } from "./NdaPreview";

type Props = { ndaTemplate: MndaTemplate; documents: GenericDocument[] };

/** AI chat on the left; on the right, the live preview of the document it is filling in. */
export function DocumentBuilder({ ndaTemplate, documents }: Props) {
  const [document, setDocument] = useState<DocumentState>({ documentType: null, fields: null });
  const [focus, setFocus] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  // Bring the part of the document the AI is asking about into view.
  useEffect(() => {
    if (focus.length === 0) return;
    previewRef.current?.querySelector(`[data-field="${focus[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  function onReply({ documentType, fields, focus }: ChatResponse) {
    setDocument({ documentType, fields });
    setFocus(focus);
  }

  const preview = renderPreview(document, ndaTemplate, documents, focus);

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
      <div className="flex h-[70vh] min-h-0 flex-col rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-200 lg:h-auto">
        <DocumentChat document={document} onReply={onReply} />
      </div>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex min-h-10 items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Preview</h2>
          {preview && <DownloadButton fileName={preview.fileName} renderPdf={preview.renderPdf} />}
        </div>
        <div ref={previewRef} className="min-h-0 flex-1 overflow-y-auto rounded-lg">
          {preview?.page ?? <Placeholder names={[NDA_TITLE, ...documents.map((doc) => doc.name)]} />}
        </div>
      </div>
    </div>
  );
}

/** The preview page, PDF file name and PDF renderer for the current document, or null before one is chosen. */
function renderPreview(document: DocumentState, ndaTemplate: MndaTemplate, documents: GenericDocument[], focus: string[]) {
  const { documentType, fields } = document;
  if (!fields) return null;
  if (documentType === NDA_ID) {
    const data = fields as NdaData;
    return {
      page: <NdaPreview template={ndaTemplate} data={data} focus={focus} />,
      fileName: pdfFileName(data),
      renderPdf: async () => {
        const { NdaPdf } = await import("./NdaPdf");
        return <NdaPdf template={ndaTemplate} data={data} />;
      },
    };
  }
  const doc = documents.find((d) => d.id === documentType)!;
  const data = fields as GenericData;
  return {
    page: <GenericPreview doc={doc} data={data} focus={focus} />,
    fileName: documentFileName(doc.name, data.parties),
    renderPdf: async () => {
      const { GenericPdf } = await import("./GenericPdf");
      return <GenericPdf doc={doc} data={data} />;
    },
  };
}

function Placeholder({ names }: { names: string[] }) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
      <p className="font-semibold text-[#032147]">Your document will appear here.</p>
      <p>Tell the assistant which agreement you need. Supported documents:</p>
      <ul className="list-disc space-y-1 pl-5">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
