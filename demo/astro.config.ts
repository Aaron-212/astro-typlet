import tailwindcss from "@tailwindcss/vite";
import typlet from "@aaron212/astro-typlet";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://demos.aaron212.com",
  base: "/astro-typlet",
  outDir: "./dist/astro-typlet",
  output: "static",
  vite: { plugins: [tailwindcss()] },
  integrations: [typlet({ copyTypst: true })],
});
