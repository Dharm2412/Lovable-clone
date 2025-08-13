export type GeneratedSpec = {
  title: string;
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  sections: Array<{ title: string; body: string }>;
};

export type GeneratedResult = { spec: GeneratedSpec; rawText: string };
export type GeneratedCodeResult = {
  steps: string[];
  html: string;
  css?: string;
  js?: string;
  rawText: string;
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGemini(parts: Array<any>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${err}`);
  }
  const json = await res.json();
  const text = (json?.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p.text || "")
    .join("");
  return text || "";
}

function extractJsonObject(text: string): GeneratedSpec {
  // Prefer fenced json blocks
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  if (fence) {
    return JSON.parse(fence[1]);
  }
  // Fallback: any fenced block
  const anyFence = text.match(/```\s*([\s\S]*?)```/);
  if (anyFence) {
    return JSON.parse(anyFence[1]);
  }
  // Fallback: largest object
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(text.slice(first, last + 1));
  }
  // Last resort: direct parse
  return JSON.parse(text);
}

export async function generateLandingSpecFromImageUrl(
  imageUrl: string
): Promise<GeneratedResult> {
  const prompt = `You are a product landing page copy and structure generator. Analyze the uploaded screenshot and produce a concise JSON spec with: title, hero {headline, subheadline, ctaText}, and 2-4 sections [{title, body}]. Keep text succinct, credible, and user-focused. Return only JSON.`;

  let imageBytes: Uint8Array | null = null;
  let mimeType = "image/png";
  try {
    const res = await fetch(imageUrl);
    mimeType = res.headers.get("content-type") ?? mimeType;
    const buf = Buffer.from(await res.arrayBuffer());
    imageBytes = new Uint8Array(buf);
  } catch {
    // Best-effort; fall back to prompt-only
  }

  const parts: Array<any> = [{ text: prompt }];
  if (imageBytes) {
    parts.push({ inlineData: { data: Buffer.from(imageBytes).toString("base64"), mimeType } });
  } else {
    parts.push({ text: `Image URL: ${imageUrl}` });
  }

  const rawText = await callGemini(parts);
  const spec = extractJsonObject(rawText);
  return { spec, rawText };
}

export async function generateLandingSpecFromPrompt(
  promptText: string
): Promise<GeneratedResult> {
  const system = `You are a product landing page copy and structure generator. Produce only JSON with the following shape: { title, hero: { headline, subheadline, ctaText }, sections: [{ title, body }] }. Keep copy crisp, credible, and user-focused.`;
  const rawText = await callGemini([{ text: system }, { text: `User request: ${promptText}` }]);
  const spec = extractJsonObject(rawText);
  return { spec, rawText };
}

export async function generateFullPageFromPrompt(promptText: string): Promise<GeneratedCodeResult> {
  const system = `You generate production-ready web pages. Return a single JSON object with keys: steps (array of short step descriptions), html (a complete HTML document with inline Tailwind classes or minimal semantic HTML), css (optional), js (optional). Do not explain outside of JSON. If css or js are provided, they must be plain text strings.`;
  const rawText = await callGemini([{ text: system }, { text: `User request: ${promptText}` }]);
  const obj = extractJsonObject(rawText) as any;
  const steps: string[] = Array.isArray(obj.steps) ? obj.steps : [];
  const html: string = String(obj.html || "");
  const css: string | undefined = obj.css ? String(obj.css) : undefined;
  const js: string | undefined = obj.js ? String(obj.js) : undefined;
  return { steps, html, css, js, rawText };
}


