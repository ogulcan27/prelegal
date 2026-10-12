/** The prelegal word mark: a yellow seal next to the name. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-lg font-bold tracking-tight ${inverted ? "text-white" : "text-navy"}`}>
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-sm font-black text-navy">
        P
      </span>
      prelegal
    </span>
  );
}
