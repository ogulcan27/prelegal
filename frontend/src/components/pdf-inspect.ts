import { Page } from "@react-pdf/renderer";
import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * Test helper: walks a react-pdf element tree, expanding our own function components, and
 * collects its text and its Page elements. This checks what the PDF says without decoding the PDF file.
 */
export function inspectPdf(node: ReactNode, found = { text: [] as string[], pages: 0 }) {
  if (typeof node === "string" || typeof node === "number") found.text.push(String(node));
  else if (Array.isArray(node)) node.forEach((child) => inspectPdf(child, found));
  else if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    if (element.type === Page) found.pages++;
    if (typeof element.type === "function") {
      inspectPdf((element.type as (props: object) => ReactNode)(element.props), found);
    } else inspectPdf(element.props.children, found);
  }
  return { pages: found.pages, text: found.text.join("") };
}
