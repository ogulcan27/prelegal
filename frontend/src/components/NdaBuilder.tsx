"use client";

import { useEffect, useState } from "react";
import { defaultNdaData, todayIso, type NdaData } from "@/lib/nda";
import type { MndaTemplate } from "@/lib/template";
import { DownloadButton } from "./DownloadButton";
import { NdaChat } from "./NdaChat";
import { NdaPreview } from "./NdaPreview";

/** AI chat on the left, live document preview on the right. */
export function NdaBuilder({ template }: { template: MndaTemplate }) {
  const [data, setData] = useState<NdaData>(defaultNdaData);

  // Default the Effective Date to the visitor's "today". Done after mount because the
  // page is prerendered at build time, when "today" is a different date.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only default
    setData((current) => (current.effectiveDate ? current : { ...current, effectiveDate: todayIso() }));
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <NdaChat data={data} onChange={setData} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Preview</h2>
          <DownloadButton template={template} data={data} />
        </div>
        <NdaPreview template={template} data={data} />
      </div>
    </div>
  );
}
