// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { json, mount, submit } from "@/test-utils";
import { AuthForm } from "./AuthForm";

const replace = vi.fn();
// One router object, like the real one, so effects that depend on it run once.
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn();
const signedOut = () => json({ detail: "Please sign in." }, 401);

function render(mode: "signin" | "signup") {
  vi.stubGlobal("fetch", fetchMock);
  return mount(<AuthForm mode={mode} />);
}

async function fillAndSubmit(container: HTMLElement, email: string, password: string) {
  container.querySelector<HTMLInputElement>('input[name="email"]')!.value = email;
  container.querySelector<HTMLInputElement>('input[name="password"]')!.value = password;
  await submit(container.querySelector("form")!);
}

describe("AuthForm", () => {
  it("signs in and goes to My documents", async () => {
    fetchMock.mockResolvedValueOnce(signedOut()).mockResolvedValueOnce(json({ id: 1, email: "a@b.com" }));
    const container = await render("signin");
    expect(replace).not.toHaveBeenCalled();

    await fillAndSubmit(container, "a@b.com", "password123");
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/auth/signin");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.com", password: "password123" });
    expect(replace).toHaveBeenCalledWith("/documents/");
  });

  it("shows the server's message when sign in fails", async () => {
    fetchMock.mockResolvedValueOnce(signedOut()).mockResolvedValueOnce(json({ detail: "Wrong email or password." }, 401));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const container = await render("signin");
    await fillAndSubmit(container, "a@b.com", "nope");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Wrong email or password.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("creates an account with a password of at least 8 characters", async () => {
    fetchMock.mockResolvedValueOnce(signedOut()).mockResolvedValueOnce(json({ id: 1, email: "a@b.com" }, 201));
    const container = await render("signup");
    expect(container.querySelector<HTMLInputElement>('input[name="password"]')!.minLength).toBe(8);
    await fillAndSubmit(container, "a@b.com", "password123");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/signup");
    expect(replace).toHaveBeenCalledWith("/documents/");
  });

  it("skips the form when already signed in", async () => {
    fetchMock.mockResolvedValueOnce(json({ id: 1, email: "a@b.com" }));
    await render("signin");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/me");
    expect(replace).toHaveBeenCalledWith("/documents/");
  });
});
