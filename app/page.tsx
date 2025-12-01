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
  const [showWorkspace, setShowWorkspace] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    // Switch to workspace view and reset states
    setShowWorkspace(true);
    setApiResponse(null);
    setLogs([]);
    setPreviewUrl(null);
    setRawText(null);
    setCodeHtml(null);
    setCodeCss(null);
    setCodeJs(null);
    setCodeSteps(null);
    setError(null); // Clear previous errors
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

      if (!res.ok) {
        const errorText = await res.text();
        setError(`API Error (${res.status}): ${errorText || "Failed to generate content"}`);
        setIsGenerating(false);
        return;
      }

      if (!res.body) {
        setError("No response body received from server");
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
              if (evt.type === "error") {
                setError(evt.message || "An error occurred during generation");
              }
            } catch (parseError) {
              console.error("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Generation was cancelled");
      } else if (err.message?.includes("fetch")) {
        setError("Network error: Unable to connect to the server");
      } else {
        setError(err.message || "An unexpected error occurred");
      }
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
<script>(function(){try{${js}}catch(e){console.error(e)}})()\<\/script>
</body></html>`;
  }, [codeHtml, codeCss, codeJs]);

  // Landing page view
  if (!showWorkspace) {
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
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-pink-500 to-orange-400" />
            <span className="text-lg font-semibold">Lovable</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <a href="#" className="hover:text-white transition-colors">Community</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Enterprise</a>
            <a href="#" className="hover:text-white transition-colors">Learn</a>
          </nav>
          <div className="flex items-center gap-3">
            <a className="rounded-md bg-white/10 px-4 py-2 text-sm text-white backdrop-blur hover:bg-white/20 transition-all" href="#">Log in</a>
            <a className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 transition-all shadow-lg" href="#">Get started</a>
          </div>
        </header>

        {/* Hero */}
        <main className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-24 text-center text-white">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl animate-fadeIn">
            Build something <span className="align-middle">💜</span> Lovable
          </h1>
          <p className="mt-4 text-lg text-neutral-300 md:text-xl animate-fadeIn">
            Create apps and websites by chatting with AI
          </p>

          {/* Chat-like input */}
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-black/60 p-6 text-left shadow-2xl backdrop-blur animate-fadeIn"
          >
            <div className="text-neutral-400 text-sm mb-3">Ask Lovable to create an internal tool that…</div>
            <div className="flex items-center justify-between gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a screenshot URL or describe what to build"
                className="h-11 flex-1 rounded-lg bg-neutral-900/60 px-4 py-2 text-neutral-200 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              <button
                type="submit"
                disabled={!canSubmit || isGenerating}
                className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? "Generating…" : "Generate"}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // Workspace view (split screen)
  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white overflow-hidden">
      {/* Left sidebar - AI Assistant */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-[#0d1117]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-pink-500 to-orange-400" />
            <span className="text-sm font-semibold">Lovable</span>
          </div>
          <button
            onClick={() => setShowWorkspace(false)}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Back to home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User prompt */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-neutral-400 mb-1">Thought for 19s</div>
            <div className="text-sm text-neutral-200">{input}</div>
          </div>

          {/* AI Response */}
          {(logs.length > 0 || codeSteps) && (
            <div className="space-y-3">
              <div className="text-sm text-neutral-300">
                {isGenerating && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>Generating...</span>
                  </div>
                )}

                {logs.length > 0 && (
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className="text-xs text-neutral-400">• {log}</div>
                    ))}
                  </div>
                )}
              </div>

              {codeSteps && codeSteps.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs font-medium text-neutral-300 mb-2">Features:</div>
                  <ul className="space-y-1">
                    {codeSteps.map((step, i) => (
                      <li key={i} className="text-xs text-neutral-400 flex items-start gap-2">
                        <span>•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-300 mb-1">Error</div>
                  <div className="text-xs text-red-200/80">{error}</div>
                  {error.includes("GEMINI_API_KEY") && (
                    <div className="mt-2 text-xs text-red-200/60">
                      💡 Tip: Add your Gemini API key to <code className="bg-black/30 px-1 rounded">.env.local</code>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-300 hover:text-red-100 transition-colors"
                  title="Dismiss error"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input at bottom */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 bg-neutral-900/60 rounded-lg px-3 py-2">
            <input
              type="text"
              placeholder="Ask Lovable..."
              className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
            />
            <button className="text-neutral-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="flex-1 flex flex-col bg-[#0b0f1a]">
        {/* Top bar */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "preview"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "code"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Code
            </button>
          </div>

          <div className="flex items-center gap-2">
            {absolutePreview && (
              <a
                href={absolutePreview}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm rounded-md bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Open ↗
              </a>
            )}
            <button className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium">
              Publish
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto">
          {!codeHtml ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                  <svg className="w-8 h-8 text-neutral-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div className="text-neutral-400 text-sm">Getting ready...</div>
              </div>
            </div>
          ) : viewMode === "preview" ? (
            <div className="h-full bg-white">
              <iframe
                key={previewSrcDoc.length}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                srcDoc={previewSrcDoc}
              />
            </div>
          ) : (
            <div className="p-4">
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
        </div>
      </div>
    </div>
  );
}
