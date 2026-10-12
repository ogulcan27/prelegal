import { DISCLAIMER } from "@/lib/documents";

/** Reminds the user that every generated document is a draft subject to legal review. */
export function Disclaimer() {
  return (
    <p role="note" className="flex gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-zinc-700">
      <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="mt-px size-4 shrink-0 text-accent">
        <path
          fillRule="evenodd"
          d="M8.485 2.495a1.75 1.75 0 0 1 3.03 0l6.28 10.875A1.75 1.75 0 0 1 16.28 16H3.72a1.75 1.75 0 0 1-1.515-2.63L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{DISCLAIMER}</span>
    </p>
  );
}
