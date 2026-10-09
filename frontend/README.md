# prelegal frontend

Next.js app for creating a Common Paper Mutual Non-Disclosure Agreement (Jira KAN-3). The user fills in a form, the agreement updates in a live preview, and the completed agreement downloads as a PDF.

See the [repository README](../README.md) for setup and commands.

## How it works

- `src/lib/load-template.ts` reads `../templates/Mutual-NDA*.md` at build time (`"use cache"`).
- `src/lib/template.ts` parses the templates into a small document model. `src/lib/nda.ts` holds the form data model and the cover-page text.
- `src/components/NdaPreview.tsx` (HTML) and `src/components/NdaPdf.tsx` (`@react-pdf/renderer`) both render from that model. The PDF library loads only when the user clicks **Download PDF**.
- PDFs use the bundled Noto Serif font (`public/fonts`, SIL Open Font License) so names with non-Latin-1 characters render correctly.
