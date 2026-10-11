"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]";

/** Placeholder sign-in: any email and password take the user into the platform. No authentication yet. */
export function LoginForm() {
  const router = useRouter();

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/nda/");
  }

  return (
    <form className="space-y-4" onSubmit={signIn}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <button
        type="submit"
        className="w-full rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
      >
        Sign in
      </button>
    </form>
  );
}
