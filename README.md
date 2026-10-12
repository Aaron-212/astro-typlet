# satteri-typlet

A [Sätteri](https://satteri.bruits.org/) HAST plugin that renders every inline and block math formula as
[Typst math](https://github.com/dbccccccc/Typlet) using Typlet. Formula contents are passed directly to Typlet;
LaTeX is not converted or rendered.

## Usage

### Astro + Sätteri

Install this plugin and Astro's configurable Sätteri processor in your Astro project:

```sh
pnpm add satteri-typlet @astrojs/markdown-satteri typlet
```

Configure `astro.config.ts`:

```ts
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { prepareTypletMath, renderTypletMath } from "satteri-typlet";

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [prepareTypletMath()],
      hastPlugins: [renderTypletMath()],
    }),
  },
});
```

Use both plugins: `prepareTypletMath()` prepares dollar-delimited block math and fenced `math` blocks before
Astro's syntax highlighter runs; `renderTypletMath()` renders the formulas afterward. Ordinary code blocks keep
Astro's default syntax highlighting. Inline math is handled directly by the HAST renderer.
See the [Astro Sätteri API reference](https://docs.astro.build/en/reference/markdown-processors/satteri/)
for processor configuration.

Import the stylesheet in the frontmatter of the Astro layout that displays your Markdown:

```astro
---
import "typlet/fonts/typlet.css";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Typst math</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

The same processor configuration applies to MDX when the `@astrojs/mdx` integration uses Astro's Markdown
configuration. Write formulas using Typst syntax, for example `$x^2 + y^2 = z^2$`.

### Standalone Sätteri

```ts
import { markdownToHtml } from "satteri";
import { renderTypletMath } from "satteri-typlet";

const markdown = `Inline math: $x^2 + y^2 = z^2$.

$$
sum_(i=1)^n i = (n(n+1))/2
$$
`;

const { html } = markdownToHtml(markdown, {
  features: { math: true },
  hastPlugins: [renderTypletMath()],
});
```

Enable `features.math` to parse dollar-delimited math. Sätteri controls the delimiters and whether a formula is
inline or display; only the formula's contents use Typst syntax. Fenced `math` code blocks also render as display
math. Ordinary code blocks and inline code are left unchanged.

Load Typlet's stylesheet in the page displaying the generated HTML. With a CSS-aware bundler:

```ts
import "typlet/fonts/typlet.css";
```

Alternatively, serve `typlet/fonts/typlet.css` and its adjacent font files and link to the stylesheet from your page.
Rendering is synchronous and does not need browser JavaScript. The generated HTML is parsed into HAST elements
so subsequent plugins and Sätteri's JavaScript/MDX compilation can process it.

## Options

The plugin accepts Typlet's `RenderOptions` except `displayMode`, which is determined by each math node.
The options type is exported as `SatteriTypletOptions`.

```ts
renderTypletMath({
  output: "htmlAndMathml",
  throwOnError: false,
  preamble: '#let norm(x) = $lr(|| #x ||)$\n#set math.equation(numbering: "(1)")',
});
```

Typlet's defaults apply: output includes HTML and accessible MathML, and invalid formulas throw a `TypletError`.
Set `throwOnError: false` to show invalid formula source in the configured error color instead.
Numbered display equations share a counter within each document, starting at one; pass `equationCounter` to manage
the counter yourself. A custom `fallback` must return markup synchronously, as required by Typlet's `renderToString`.
See [Typlet's documentation](https://github.com/dbccccccc/Typlet#usage) for supported syntax and rendering options.

## Development

```sh
mise install
mise exec -- pnpm install
mise exec -- pnpm format
mise exec -- pnpm lint
mise exec -- pnpm check
```

Run `mise exec -- pnpm build` to generate JavaScript and TypeScript declarations in `dist/`.
