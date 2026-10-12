/** Helpers for component tests that run in happy-dom with React's act(). */
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Lets pending fetches and the state updates after them finish. */
export const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** Renders `element` into a fresh container that replaces the previous test's, then flushes. */
export async function mount(element: ReactElement): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  await act(async () => createRoot(container).render(element));
  await flush();
  return container;
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const submitEvent = () => new Event("submit", { bubbles: true, cancelable: true });

export const submit = (form: HTMLFormElement) => act(async () => void form.dispatchEvent(submitEvent()));

/** Types `text` into the container's textarea, then sends it (by default, by submitting its form). */
export async function typeAndSend(
  container: HTMLElement,
  text: string,
  send: (textarea: HTMLTextAreaElement) => unknown = (textarea) => textarea.form!.dispatchEvent(submitEvent()),
) {
  const textarea = container.querySelector("textarea")!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(textarea, text);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => send(textarea));
}
