import { NextRequest } from "next/server";
import {
  generateLandingSpecFromImageUrl,
  generateLandingSpecFromPrompt,
  generateFullPageFromPrompt,
  type GeneratedResult,
} from "@/lib/ai";
import { generatedPagesStore, type GeneratedPage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function step(
  controller: ReadableStreamDefaultController<Uint8Array>,
  message: string
) {
  controller.enqueue(new TextEncoder().encode(sse({ type: "progress", message })));
  await new Promise((r) => setTimeout(r, 350));
}

export async function POST(req: NextRequest) {
  const { input } = (await req.json().catch(() => ({}))) as { input?: string };
  if (!input) return new Response("Missing input", { status: 400 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Determine input type
        let imageUrl: string | null = null;
        try {
          imageUrl = new URL(input).toString();
          await step(controller, "Detected screenshot URL");
        } catch {
          await step(controller, "Detected free-form prompt");
        }

        if (!process.env.GEMINI_API_KEY) {
          await step(controller, "GEMINI_API_KEY missing – using defaults");
        }

        await step(controller, "Calling Gemini to draft the page spec and code");
        let result: GeneratedResult | null = null;
        let code: { steps: string[]; html: string; css?: string; js?: string; rawText: string } | null = null;
        let aiError: string | null = null;
        try {
          result = imageUrl
            ? await generateLandingSpecFromImageUrl(imageUrl)
            : await generateLandingSpecFromPrompt(input);
          if (!imageUrl) {
            code = await generateFullPageFromPrompt(input);
          }
          await step(controller, "AI draft ready");
        } catch (e: any) {
          aiError = e?.message || "AI call failed";
          await step(controller, "AI failed — using a sensible default");
          result = {
            rawText: "",
            spec: {
              title: "Generated Landing Page",
              hero: {
                headline: "Grow your audience with clear storytelling",
                subheadline:
                  "Turn ideas into a compelling personal brand with simple, effective content systems.",
                ctaText: "Get Started",
              },
              sections: [
                {
                  title: "What you’ll get",
                  body:
                    "A clean hero, clear value props, and a focused call-to-action. Optimized for speed and clarity.",
                },
                {
                  title: "Why it works",
                  body:
                    "Less fluff, more signal. Build credibility with social proof and results that speak for themselves.",
                },
              ],
            },
          };
        }

        await step(controller, "Assembling preview");

        // Save to store and build preview URL
        const id = Math.random().toString(36).slice(2, 10);
        const page: GeneratedPage = {
          id,
          title: result!.spec.title,
          hero: {
            imageUrl: imageUrl ?? "",
            headline: result!.spec.hero.headline,
            subheadline: result!.spec.hero.subheadline,
            ctaText: result!.spec.hero.ctaText,
          },
          sections: result!.spec.sections,
          html: code?.html,
        };
        generatedPagesStore.set(id, page);
        const previewUrl = `/preview/${id}`;

        controller.enqueue(
          new TextEncoder().encode(
            sse({ type: "complete", spec: page, previewUrl, rawText: result!.rawText, steps: code?.steps, codeHtml: code?.html, codeCss: code?.css, codeJs: code?.js, codeRawText: code?.rawText, diagnostics: aiError ? { aiError } : undefined })
          )
        );
        controller.close();
      } catch (e) {
        controller.enqueue(
          new TextEncoder().encode(sse({ type: "error", message: "Unexpected error" }))
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}


