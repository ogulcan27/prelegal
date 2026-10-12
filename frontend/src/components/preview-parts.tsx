import { PARTY_FOCUS_KEYS } from "@/lib/documents";
import type { SignatureRow, Value } from "@/lib/nda";

/** Accent-yellow highlight for the part of the document the AI is asking about. */
export const FOCUS_CLASS = "rounded bg-accent/25 ring-2 ring-accent";

export const focusClass = (focus: string[], key: string | undefined) =>
  key !== undefined && focus.includes(key) ? FOCUS_CLASS : "";

/** A filled-in value, or its bracketed placeholder marked as still missing. */
export function Filled({ value }: { value: Value }) {
  return value.missing ? <mark className="rounded bg-amber-100 px-1 text-amber-900">{value.text}</mark> : value.text;
}

type SignatureTableProps = { headers: readonly string[]; rows: SignatureRow[]; focus: string[] };

/** Party details and signature lines, one column per party. A focused party's column is highlighted. */
export function SignatureTable({ headers, rows, focus }: SignatureTableProps) {
  const column = (i: number) => focusClass(focus, PARTY_FOCUS_KEYS[i]);
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className="w-1/4 border border-zinc-300 p-2" />
          {headers.map((header, i) => (
            <th key={header} data-field={PARTY_FOCUS_KEYS[i]} className={`border border-zinc-300 p-2 text-center ${column(i)}`}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th className="border border-zinc-300 p-2 font-semibold">{row.label}</th>
            {row.values.map((value, i) => (
              <td key={i} className={`border border-zinc-300 p-2 text-center ${row.toSign ? "h-12" : "h-9"} ${column(i)}`}>
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
