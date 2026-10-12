import type { ReactNode } from "react";
import { DISCLAIMER } from "@/lib/documents";
import { Logo } from "./Logo";

const FEATURES = [
  "Mutual NDAs, cloud, services, data and partnership agreements",
  "An AI assistant that asks the right questions and fills in the terms",
  "Live preview and a ready-to-sign PDF",
];

/** Two-column frame for the sign-in and sign-up screens: product story on the left, the form on the right. */
export function AuthPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid flex-1 lg:min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Logo inverted />
        <div className="max-w-md space-y-6">
          <p className="text-3xl font-bold leading-tight tracking-tight">Draft legal agreements in minutes, not days.</p>
          <ul className="space-y-3 text-sm text-zinc-200">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex gap-3">
                <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-xs text-zinc-400">Based on Common Paper standard terms (CC BY 4.0).</p>
      </section>
      <section className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </header>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">{children}</div>
          <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
        </div>
      </section>
    </main>
  );
}
