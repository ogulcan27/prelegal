import { NdaBuilder } from "@/components/NdaBuilder";
import { loadMndaTemplate } from "@/lib/load-template";

export default async function Home() {
  const template = await loadMndaTemplate();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mutual NDA Creator</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Fill in the details below to complete a Common Paper Mutual Non-Disclosure Agreement. The preview updates as
          you type, and you can download the finished agreement as a PDF.
        </p>
      </header>
      <NdaBuilder template={template} />
    </main>
  );
}
