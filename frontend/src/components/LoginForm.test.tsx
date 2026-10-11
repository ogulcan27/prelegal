// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  act(() => createRoot(container).render(<LoginForm />));
});

afterEach(() => {
  container.remove();
  push.mockClear();
});

describe("LoginForm", () => {
  it("requires an email and a password", () => {
    const email = container.querySelector<HTMLInputElement>('input[name="email"]')!;
    const password = container.querySelector<HTMLInputElement>('input[name="password"]')!;
    expect(email.type).toBe("email");
    expect(email.required).toBe(true);
    expect(password.type).toBe("password");
    expect(password.required).toBe(true);
  });

  it("takes the user to the NDA creator on submit", () => {
    const form = container.querySelector("form")!;
    act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(push).toHaveBeenCalledWith("/nda/");
  });
});
