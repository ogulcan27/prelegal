"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getMe, MIN_PASSWORD_LENGTH, signIn, signUp } from "@/lib/auth";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const MODES = {
  signin: { submit: signIn, label: "Sign in", busy: "Signing in…", password: "current-password" },
  signup: { submit: signUp, label: "Create account", busy: "Creating account…", password: "new-password" },
} as const;

/** Sign-in or sign-up form; on success, or when already signed in, goes to My documents. */
export function AuthForm({ mode }: { mode: keyof typeof MODES }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { submit, label, busy: busyLabel, password } = MODES[mode];

  useEffect(() => {
    getMe().then(() => router.replace("/documents/"), () => {});
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await submit({ email: String(form.get("email")), password: String(form.get("password")) });
      router.replace("/documents/");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={password}
          className={inputClass}
        />
        {mode === "signup" && <span className="text-xs text-muted">At least {MIN_PASSWORD_LENGTH} characters.</span>}
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {busy ? busyLabel : label}
      </button>
      <p className="text-center text-sm text-zinc-600">
        {mode === "signin" ? "New to prelegal? " : "Already have an account? "}
        <Link href={mode === "signin" ? "/signup/" : "/"} className="font-semibold text-primary hover:underline">
          {mode === "signin" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
