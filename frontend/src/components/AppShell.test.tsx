// @vitest-environment happy-dom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { json, mount } from "@/test-utils";
import { AppShell } from "./AppShell";

const replace = vi.fn();
// One router object, like the real one, so effects that depend on it run once.
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/documents/" }));

const fetchMock = vi.fn();

function render(me: Response) {
  fetchMock.mockResolvedValueOnce(me);
  vi.stubGlobal("fetch", fetchMock);
  return mount(
    <AppShell>
      <p>page</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("sends visitors without a session to sign in and shows nothing", async () => {
    const container = await render(json({ detail: "Please sign in." }, 401));
    expect(replace).toHaveBeenCalledWith("/");
    expect(container.textContent).toBe("");
  });

  it("shows the header with the user's email above the page", async () => {
    const container = await render(json({ id: 1, email: "a@b.com" }));
    expect(container.querySelector("header")?.textContent).toContain("a@b.com");
    expect(container.textContent).toContain("page");
  });

  it("signs out and goes to sign in", async () => {
    const container = await render(json({ id: 1, email: "a@b.com" }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const signOut = [...container.querySelectorAll("button")].find((b) => b.textContent === "Sign out")!;
    await act(async () => signOut.click());
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/signout");
    expect(replace).toHaveBeenCalledWith("/");
  });
});
