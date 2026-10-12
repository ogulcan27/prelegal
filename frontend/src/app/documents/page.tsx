import { DocumentBuilder } from "@/components/DocumentBuilder";
import { loadGenericDocuments, loadMndaTemplate } from "@/lib/load-template";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Creator | prelegal",
  description: "Draft Common Paper legal agreements with an AI assistant and download them as PDFs.",
};

export default async function Documents() {
  const [ndaTemplate, documents] = await Promise.all([loadMndaTemplate(), loadGenericDocuments()]);

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:h-screen lg:px-8">
      <header className="mb-4 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#032147]">prelegal</h1>
        <p className="text-sm text-[#888888]">
          Chat with the assistant to draft a Common Paper agreement. The preview fills in as you answer, and the part
          being discussed is highlighted.
        </p>
      </header>
      <DocumentBuilder ndaTemplate={ndaTemplate} documents={documents} />
    </main>
  );
}
