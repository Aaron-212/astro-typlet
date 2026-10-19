# @aaron212/astro-typlet

Render [Typst math](https://github.com/dbccccccc/Typlet) in Astro and [Sätteri](https://satteri.bruits.org/) using Typlet.
Supports Astro components, inline math, display math, and fenced `typlet` code blocks. Formulas use Typst syntax.
Rendering runs on the server and does not require browser JavaScript.

See the [demo site](http://demos.aaron212.com/astro-typlet/).

## Astro component

Install the package in your Astro project:

```sh
pnpm add @aaron212/astro-typlet
```

Use the `Typst` component to render formulas directly in `.astro` pages and components:

```astro
---
import Typst from "@aaron212/astro-typlet/components/Typst.astro";
---

<p>
  The energy is <Typst>e = m c^2</Typst>.
</p>

<Typst displayMode throwOnError={false}>
  x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)
</Typst>
```

Write Typst math source between the component's tags, without `$` or `$$` delimiters. Inline rendering is the
default; set `displayMode` for a display equation. The component accepts Typlet's `RenderOptions` as props, including
`preamble`, `output`, and `throwOnError`. Multiline formulas can also be written directly between the tags.
Use the optional `formula` prop for dynamic formulas or source containing characters such as `{` and `<`, which
Astro would otherwise interpret as template syntax. When provided, `formula` takes precedence over the default
slot, including when it is an empty string. The prop is passed directly to Typlet without HTML decoding:

```astro
<Typst formula={"a < b"} />

<Typst
  displayMode
  formula={`sum_(i=1)^n i
  = (n(n+1))/2`}
/>
```

The component renders on the server and imports Typlet's stylesheet and fonts automatically. It works without the
Astro integration or a Markdown processor. Rendering options passed to `typlet()` configure Markdown and MDX only;
pass options to `Typst` separately. Raw dollar-delimited text in `.astro` templates is left unchanged.

To share equation numbering across components, create an `equationCounter` object (`{ value: 0 }`) in the page's
frontmatter and pass that same object to each `Typst` component. Create a new counter per page render rather than
sharing one at module scope. The integration's `copyTypst: true` script also works with component-rendered formulas.

## Astro markdown

Astro 7 uses Sätteri by default, so no separate processor installation or configuration is needed.
Install the integration:

```sh
pnpm add @aaron212/astro-typlet
```

Configure `astro.config.ts` and pass rendering options to `typlet()`:

```ts
import { defineConfig } from "astro/config";
import typlet from "@aaron212/astro-typlet";

export default defineConfig({
  integrations: [typlet({ throwOnError: false, copyTypst: true })],
});
```

The plugin renders inline math, block math, and fenced code blocks labeled `typlet` using Typst math syntax.

For example, the following blocks are rendered as Typst formulas:

````md
$ e = m c^2 $

$$
x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)
$$

```typlet
f(x) = x^2 + 3x + 2
```
````

Write formulas in Typst syntax. To avoid conflicts, disable other plugins that process LaTeX math.

The `AstroTypletOptions` type is exported from `@aaron212/astro-typlet`. The integration registers the plugins with
the supplied rendering options and enables Sätteri's math feature when dollar-delimited math is selected,
preserving existing math parser options.

MDX inherits this configuration when `@astrojs/mdx` uses the site's Markdown processor. An explicit MDX processor
override must be configured separately. Astro dependencies are optional peers;
standalone Sätteri users can use `@aaron212/astro-typlet/satteri` without installing Astro.

## Standalone Satteri

Install the integration and Sätteri:

```sh
pnpm add @aaron212/astro-typlet satteri
```

```ts
import { markdownToHtml } from "satteri";
import { prepareTypletMath, renderTypletMath } from "@aaron212/astro-typlet/satteri";

const markdown = `Inline math: $x^2 + y^2 = z^2$.

$$
sum_(i=1)^n i = (n(n+1))/2
$$
`;

const { html } = markdownToHtml(markdown, {
  features: { math: true },
  mdastPlugins: [prepareTypletMath()],
  hastPlugins: [
    renderTypletMath({
      output: "htmlAndMathml",
      throwOnError: false,
      preamble: '#let norm(x) = $lr(|| #x ||)$\n#set math.equation(numbering: "(1)")',
    }),
  ],
});
```

Use `prepareTypletMath()` before rendering and `renderTypletMath()` afterward. When selecting syntax manually, pass
the same `syntax` option to both plugins. Pass rendering options to `renderTypletMath()`.
The `TypletMathOptions` type is exported from
`@aaron212/astro-typlet/satteri`. `copyTypst` is available only through the Astro integration.

The standalone renderer also accepts `syntax: "math" | "typlet" | "both"`, defaulting to `"both"`.
Enable `features.math` to parse dollar-delimited math; it is not required for `syntax: "typlet"`.
Sätteri controls the delimiters and whether a formula is
inline or display; only the formula's contents use Typst syntax. Fenced `typlet` code blocks also render as display
math. Ordinary code blocks and inline code are left unchanged.

Rendering is synchronous and does not need browser JavaScript. The generated HTML is parsed into HAST elements
so subsequent plugins and Sätteri's JavaScript/MDX compilation can process it.

## Styling and Config

Set `syntax` to choose which Markdown syntax Typlet renders:

| `syntax`           | Rendered as Typst                                     |
| ------------------ | ----------------------------------------------------- |
| `"math"`           | Inline `$...$` and display `$$...$$` math             |
| `"typlet"`         | Fenced code blocks labeled `typlet`                   |
| `"both"` (default) | Both dollar-delimited math and fenced `typlet` blocks |

For example, `typlet({ syntax: "typlet" })` renders only fenced `typlet` blocks and leaves the processor's math
feature setting unchanged. Unselected syntax remains available to the rest of the Markdown pipeline.

Set `copyTypst: true` to load `@aaron212/astro-typlet/runtime` as a bundled client-side script on every page. When users
copy rendered formulas, the clipboard's plain text contains their Typst source with math delimiters. This option
defaults to `false`.

The Astro component and Markdown integration load Typlet's stylesheet and fonts automatically.
For standalone Sätteri, import the stylesheet in the page displaying the generated HTML with a CSS-aware bundler:

```ts
import "@aaron212/astro-typlet/styles.css";
```

Typlet is included as a dependency; consumers do not need to install it directly. Its rendering API and types are
re-exported from `@aaron212/astro-typlet/typlet`:

```ts
import { renderToString, type RenderOptions } from "@aaron212/astro-typlet/typlet";
```

The `@aaron212/astro-typlet/runtime` entry point re-exports Typlet's copy helpers and registers its browser copy handler
when imported. Use it to enable copying without the Astro integration.

Both `typlet()` and `renderTypletMath()` accept Typlet's `RenderOptions` except `displayMode`, which is determined
by each math node. The `Typst` Astro component accepts all rendering options as props, including `displayMode`.
Use the configuration example for your entry point above.

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
