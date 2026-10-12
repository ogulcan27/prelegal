"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listDocuments, type DocumentSummary } from "@/lib/saved-documents";

const updated = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** The signed-in user's saved documents, newest first. */
export function DocumentList() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listDocuments().then(setDocuments, () => setError(true));
  }, []);

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load your documents. Please reload the page.
      </p>
    );
  }
  if (!documents) return <p className="text-sm text-muted">Loading your documents…</p>;
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <p className="font-semibold text-navy">No documents yet</p>
        <p className="mt-1 text-sm text-zinc-600">Start a new document and the assistant will help you fill it in.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/editor/?id=${doc.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50"
          >
            <span className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M4 3.5A1.5 1.5 0 0 1 5.5 2h6.379a1.5 1.5 0 0 1 1.06.44l2.622 2.62A1.5 1.5 0 0 1 16 6.122V16.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-13Z" />
                </svg>
              </span>
              <span className="font-medium text-navy">{doc.title}</span>
            </span>
            <span className="shrink-0 text-sm text-muted">{updated.format(new Date(doc.updatedAt))}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
