"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getMe, signOut, type User } from "@/lib/auth";
import { Logo } from "./Logo";

/** Signed-in pages: sends visitors without a session to sign in, then shows the app header above `children`. */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(setUser, () => router.replace("/"));
  }, [router]);

  if (!user) return null;
  return (
    <>
      <AppHeader email={user.email} onSignOut={() => signOut().finally(() => router.replace("/"))} />
      {children}
    </>
  );
}

function AppHeader({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const pathname = usePathname();
  const navClass = (path: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      pathname === path ? "bg-zinc-100 text-navy" : "text-zinc-600 hover:bg-zinc-50 hover:text-navy"
    }`;

  return (
    <header className="sticky top-0 z-10 h-header border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/documents/" aria-label="My documents">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/documents/" className={navClass("/documents/")}>
            My documents
          </Link>
          {/* A full page load, so the editor always starts fresh, even when it is already open. */}
          <a href="/editor/" className={navClass("/editor/")}>
            New document
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{email}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-navy"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
