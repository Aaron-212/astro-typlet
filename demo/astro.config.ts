import { createRequire } from "node:module";
import { dirname } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import typlet from "@aaron212/astro-typlet";
import { defineConfig } from "astro/config";

const requireFromTyplet = createRequire(import.meta.resolve("@aaron212/astro-typlet/styles.css"));
const typletFontsDir = dirname(requireFromTyplet.resolve("typlet/fonts/typlet.css"));

export default defineConfig({
  site: "https://demos.aaron212.com",
  base: "/astro-typlet",
  outDir: "./build/astro-typlet",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    // The linked integration's fonts resolve outside the demo workspace.
    server: { fs: { allow: [".", typletFontsDir] } },
  },
  integrations: [typlet({ copyTypst: true })],
});
