"use client";

import { useState } from "react";
import { pdfFileName, type NdaData } from "@/lib/nda";
import type { MndaTemplate } from "@/lib/template";

type Props = { template: MndaTemplate; data: NdaData };

/** Generates the PDF in the browser. The PDF library is loaded on first click to keep the page light. */
export function DownloadButton({ template, data }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const [{ pdf }, { NdaPdf, registerPdfFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NdaPdf"),
      ]);
      registerPdfFonts((file) => new URL(`/fonts/${file}`, window.location.origin).href);
      const blob = await pdf(<NdaPdf template={template} data={data} />).toBlob();
      saveFile(blob, pdfFileName(data));
    } catch (err) {
      console.error(err);
      setError("Could not generate the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Generating PDF…" : "Download PDF"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Triggers a browser download. The object URL is released later so slower browsers can start the download. */
function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
