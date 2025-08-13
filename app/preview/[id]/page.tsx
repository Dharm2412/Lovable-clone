import { notFound } from "next/navigation";
import { generatedPagesStore } from "@/lib/store";

export default function Preview({ params }: { params: { id: string } }) {
  const page = generatedPagesStore.get(params.id);
  if (!page) return notFound();

  if (page.html && page.html.trim().length > 0) {
    return (
      <iframe
        srcDoc={page.html}
        sandbox="allow-scripts"
        className="fixed inset-0 h-screen w-screen border-0"
      />
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-white text-neutral-900 p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold">Preview not available</h1>
        <p className="mt-2 text-neutral-600">This page has no generated HTML yet. Try regenerating from the home page.</p>
        <a href="/" className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white">Go home</a>
      </div>
    </main>
  );
}


