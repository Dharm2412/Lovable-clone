"use client";

import { useMemo } from "react";

export type LivePreviewProps = {
  html: string;
  css: string;
  js: string;
  onChangeHtml: (v: string) => void;
  onChangeCss: (v: string) => void;
  onChangeJs: (v: string) => void;
};

export default function LivePreview({
  html,
  css,
  js,
  onChangeHtml,
  onChangeCss,
  onChangeJs,
}: LivePreviewProps) {
  const srcDoc = useMemo(() => {
    const safeJs = (js || "").replace(/<\/(script)/gi, "<\\/$1");
    return `<!DOCTYPE html><html><head><meta charset=\"utf-8\" />
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
<style>${css || ""}</style></head><body>${html || ""}
<script>(function(){try{${safeJs}}catch(e){console.error(e)}})()<\/script>
</body></html>`;
  }, [html, css, js]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3">
        <label className="text-sm text-neutral-300">HTML</label>
        <textarea
          value={html}
          onChange={(e) => onChangeHtml(e.target.value)}
          className="h-40 w-full rounded-md border border-white/10 bg-neutral-900/70 p-3 text-xs text-neutral-100"
          spellCheck={false}
        />
        <label className="text-sm text-neutral-300">CSS</label>
        <textarea
          value={css}
          onChange={(e) => onChangeCss(e.target.value)}
          className="h-32 w-full rounded-md border border-white/10 bg-neutral-900/70 p-3 text-xs text-neutral-100"
          spellCheck={false}
        />
        <label className="text-sm text-neutral-300">JavaScript</label>
        <textarea
          value={js}
          onChange={(e) => onChangeJs(e.target.value)}
          className="h-32 w-full rounded-md border border-white/10 bg-neutral-900/70 p-3 text-xs text-neutral-100"
          spellCheck={false}
        />
      </div>
      <div>
        <div className="mb-2 text-sm text-neutral-300">Live preview</div>
        <iframe
          key={srcDoc.length}
          sandbox="allow-scripts"
          className="h-full min-h-[28rem] w-full rounded-md border border-white/10 bg-white"
          srcDoc={srcDoc}
        />
        <p className="mt-2 text-xs text-neutral-400">
          Preview runs in a sandboxed iframe (scripts allowed, no same-origin access).
        </p>
      </div>
    </div>
  );
}


