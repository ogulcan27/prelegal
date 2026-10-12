import { Suspense } from "react";
import type { Metadata } from "next";
import { Editor } from "@/components/Editor";
import { loadGenericDocuments, loadMndaTemplate } from "@/lib/load-template";

export const metadata: Metadata = {
  title: "Editor | prelegal",
  description: "Draft Common Paper legal agreements with an AI assistant and download them as PDFs.",
};

export default async function EditorPage() {
  const [ndaTemplate, documents] = await Promise.all([loadMndaTemplate(), loadGenericDocuments()]);

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:h-[calc(100dvh-var(--spacing-header))] lg:px-8">
      <Suspense>
        <Editor ndaTemplate={ndaTemplate} documents={documents} />
      </Suspense>
    </main>
  );
}
