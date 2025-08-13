export type GeneratedPage = {
  id: string;
  title: string;
  hero: {
    imageUrl: string;
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  sections: Array<{ title: string; body: string }>;
  html?: string;
};

type GlobalWithStore = typeof globalThis & {
  __GENERATED_PAGES__?: Map<string, GeneratedPage>;
};

const g = globalThis as GlobalWithStore;
if (!g.__GENERATED_PAGES__) {
  g.__GENERATED_PAGES__ = new Map<string, GeneratedPage>();
}

export const generatedPagesStore = g.__GENERATED_PAGES__!;


