import type { Metadata } from "next";
import { DocumentList } from "@/components/DocumentList";

export const metadata: Metadata = {
  title: "My documents | prelegal",
  description: "Your drafted legal agreements.",
};

export default function MyDocuments() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">My documents</h1>
          <p className="text-sm text-muted">Every agreement you draft is saved here. Open one to continue where you left off.</p>
        </div>
        <a
          href="/editor/"
          className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          New document
        </a>
      </div>
      <DocumentList />
    </main>
  );
}
