"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LivePreview from "@/components/LivePreview";

type StreamEvent =
  | { type: "progress"; message: string }
  | {
      type: "complete";
      spec: any;
      previewUrl: string;
      rawText?: string;
      codeHtml?: string;
      codeCss?: string;
      codeJs?: string;
      steps?: string[];
    }
  | { type: "error"; message: string };

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [absolutePreview, setAbsolutePreview] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [codeHtml, setCodeHtml] = useState<string | null>(null);
  const [codeSteps, setCodeSteps] = useState<string[] | null>(null);
  const [codeCss, setCodeCss] = useState<string | null>(null);
  const [codeJs, setCodeJs] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    setApiResponse(null);
    setLogs([]);
    setPreviewUrl(null);
    setRawText(null);
    setIsGenerating(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setIsGenerating(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIndex: number;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          for (const line of rawEvent.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const json = trimmed.replace(/^data:\s?/, "");
            if (!json) continue;
            try {
              const evt = JSON.parse(json) as StreamEvent;
              if (evt.type === "progress") {
                setLogs((prev) => [...prev, evt.message]);
              }
              if (evt.type === "complete") {
                setApiResponse(evt);
                if (evt.previewUrl) setPreviewUrl(evt.previewUrl);
                if (evt.rawText) setRawText(evt.rawText);
                if (evt.codeHtml) setCodeHtml(evt.codeHtml);
                if (evt.codeCss) setCodeCss(evt.codeCss);
                if (evt.codeJs) setCodeJs(evt.codeJs);
                if (evt.steps) setCodeSteps(evt.steps);
              }
            } catch {}
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsGenerating(false);
      controllerRef.current = null;
    }
  };

  const canSubmit = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    if (!previewUrl) {
      setAbsolutePreview(null);
      return;
    }
    try {
      const abs = new URL(previewUrl, window.location.origin).toString();
      setAbsolutePreview(abs);
    } catch {
      setAbsolutePreview(previewUrl);
    }
  }, [previewUrl]);

  const previewSrcDoc = useMemo(() => {
    const html = codeHtml ?? "";
    const css = codeCss ?? "";
    const js = (codeJs ?? "").replace(/<\/(script)/gi, "<\\/$1>");
    return `<!DOCTYPE html><html><head><meta charset=\"utf-8\" />
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
<style>${css}</style></head><body>${html}
<script>(function(){try{${js}}catch(e){console.error(e)}})()<\\/script>
</body></html>`;
  }, [codeHtml, codeCss, codeJs]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 80%, rgba(255,120,80,0.4) 0%, rgba(255,120,80,0.08) 35%, transparent 60%), radial-gradient(1200px 600px at 50% 20%, rgba(0,100,255,0.35) 0%, rgba(0,100,255,0.08) 40%, transparent 60%), linear-gradient(180deg, #0b0f1a 0%, #0b0f1a 35%, #121826 100%)",
        }}
      />

      {/* Navbar */}
      <header className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-pink-500 to-orange-400" />
          <span className="text-lg font-semibold">Lovable</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
          <a href="#" className="hover:text-white">Community</a>
          <a href="#" className="hover:text-white">Pricing</a>
          <a href="#" className="hover:text-white">Enterprise</a>
          <a href="#" className="hover:text-white">Learn</a>
          <a href="#" className="hover:text-white">Launched</a>
        </nav>
        <div className="flex items-center gap-3">
          <a className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/20" href="#">Log in</a>
          <a className="rounded-md bg-white px-3 py-1.5 text-sm text-black hover:bg-neutral-100" href="/generate">Get started</a>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-24 text-center text-white">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">
          Build something <span className="align-middle">💜</span> Lovable
        </h1>
        <p className="mt-4 text-lg text-neutral-300 md:text-xl">
          Create apps and websites by chatting with AI
        </p>

        {/* Chat-like input (working) */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-black/60 p-4 text-left shadow-2xl backdrop-blur"
        >
          <div className="text-neutral-400 text-sm">Ask Lovable to create an internal tool that…</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a screenshot URL or describe what to build"
              className="h-10 flex-1 rounded-md bg-neutral-900/60 px-3 py-2 text-neutral-200 placeholder:text-neutral-500 outline-none"
            />
            <button
              type="submit"
              disabled={!canSubmit || isGenerating}
              className="inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-60"
            >
              {isGenerating ? "Generating…" : "Generate"}
            </button>
          </div>

          {/* Progress with loader */}
          <div className="mt-4 text-left text-sm text-neutral-300">
            {isGenerating && (
              <div className="mb-2 inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>Generating…</span>
              </div>
            )}
            {logs.length > 0 && (
              <ol className="list-decimal list-inside space-y-1">
                {logs.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ol>
            )}
          </div>

          {/* Professional external preview actions */}
          {absolutePreview && (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <a
                className="inline-flex items-center rounded-md bg-white px-3 py-1.5 font-medium text-black hover:bg-neutral-100"
                href={absolutePreview}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open preview ↗
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(absolutePreview);
                  } catch {}
                }}
                className="inline-flex items-center rounded-md border border-white/15 px-3 py-1.5 text-white hover:bg-white/10"
              >
                Copy link
              </button>
            </div>
          )}

          {/* Removed raw JSON/LLM output for a cleaner, professional UI */}

          {codeSteps && codeSteps.length > 0 && (
            <div className="mt-4 text-left text-sm text-neutral-300">
              <div className="mb-1">Build steps</div>
              <ol className="list-decimal list-inside space-y-1">
                {codeSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Toggle: Preview | Code */}
          <div className="mt-6 flex items-center justify-center">
            <div className="rounded-full border border-white/15 bg-white/5 px-1 py-1 text-xs backdrop-blur">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`rounded-full px-3 py-1 ${viewMode === "preview" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className={`rounded-full px-3 py-1 ${viewMode === "code" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                Code
              </button>
            </div>
          </div>

          {viewMode === "preview" ? (
            <div className="mt-4">
              <iframe
                key={previewSrcDoc.length}
                sandbox="allow-scripts"
                className="h-[60vh] w-full rounded-md border border-white/10 bg-white"
                srcDoc={previewSrcDoc}
              />
            </div>
          ) : (
            <div className="mt-4">
              <LivePreview
                html={codeHtml ?? ""}
                css={codeCss ?? ""}
                js={codeJs ?? ""}
                onChangeHtml={(v) => setCodeHtml(v)}
                onChangeCss={(v) => setCodeCss(v)}
                onChangeJs={(v) => setCodeJs(v)}
              />
            </div>
          )}

          {/* Visual preview removed */}
        </form>
      </main>
    </div>
  );
}
