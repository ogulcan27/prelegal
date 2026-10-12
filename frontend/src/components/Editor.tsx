"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { GenericDocument } from "@/lib/documents";
import { getDocument, type SavedDocument } from "@/lib/saved-documents";
import type { MndaTemplate } from "@/lib/template";
import { DocumentBuilder } from "./DocumentBuilder";

type Props = { ndaTemplate: MndaTemplate; documents: GenericDocument[] };
type Loaded = { saved: SavedDocument | null } | "loading" | "missing";

/** Opens the saved document named by `?id=`, or a new one without it. */
export function Editor({ ndaTemplate, documents }: Props) {
  const searchParams = useSearchParams();
  // Read once: the builder later rewrites the URL to `?id=` of the document it just saved.
  const [id] = useState(() => Number(searchParams.get("id")) || null);
  const [loaded, setLoaded] = useState<Loaded>(id === null ? { saved: null } : "loading");

  useEffect(() => {
    if (id === null) return;
    getDocument(id).then(
      (saved) => setLoaded({ saved }),
      () => setLoaded("missing"),
    );
  }, [id]);

  if (loaded === "loading") return <p className="text-sm text-muted">Opening your document…</p>;
  if (loaded === "missing") {
    return (
      <div className="mx-auto mt-16 max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-lg font-semibold text-navy">Document not found</h1>
        <p className="text-sm text-zinc-600">It may belong to another account, or the server was restarted.</p>
        <Link href="/documents/" className="inline-block text-sm font-semibold text-primary hover:underline">
          Back to My documents
        </Link>
      </div>
    );
  }
  return <DocumentBuilder ndaTemplate={ndaTemplate} documents={documents} saved={loaded.saved} />;
}
