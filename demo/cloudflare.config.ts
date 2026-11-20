import { defineConfig, triggers } from "cf/config";

export default defineConfig(({ isPreview }) => ({
  worker: {
    name: "astro-typlet-demo",
    compatibilityDate: "2026-10-19",
    workersDev: false,
    previewUrls: false,
    assets: {
      notFoundHandling: "404-page",
    },
    triggers: isPreview
      ? []
      : [
          triggers.fetch({ pattern: "demos.aaron212.com/astro-typlet", zone: "aaron212.com" }),
          triggers.fetch({ pattern: "demos.aaron212.com/astro-typlet/*", zone: "aaron212.com" }),
        ],
  },
}));
