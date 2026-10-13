# @aaron212/astro-typlet

A pair of [Sätteri](https://satteri.bruits.org/) plugins, an Astro integration, and an Astro component that render math as
[Typst math](https://github.com/dbccccccc/Typlet) using Typlet. Formula contents are passed directly to Typlet;
LaTeX is not converted or rendered.

For a simple demo, checkout [the demo site](http://aaron212.com/blog/typlet-test/).

## Usage

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

### Astro integration

For Astro 7, install the package directly:

```sh
pnpm add @aaron212/astro-typlet typlet
```

Configure `astro.config.ts` and pass rendering options to `typlet()`:

```ts
import { defineConfig } from "astro/config";
import typlet from "@aaron212/astro-typlet/astro";

export default defineConfig({
  integrations: [typlet({ throwOnError: false, copyTypst: true })],
});
```

The `AstroTypletOptions` type is exported from `@aaron212/astro-typlet/astro`. The integration enables Sätteri's
math feature and registers the plugins with the supplied rendering options.

Set `copyTypst: true` to load `typlet/contrib/copy-typst` as a bundled client-side script on every page. When users
copy rendered formulas, the clipboard's plain text contains their Typst source with math delimiters. This option
defaults to `false`.

MDX inherits this configuration when `@astrojs/mdx` uses the site's Markdown processor. An explicit MDX processor
override must be configured separately with the plugins shown below. Astro dependencies are optional peers;
standalone Sätteri users can continue using the package's main entry point without installing Astro.

### Formulas in Astro files

Use the `Typst` component to render formulas directly in `.astro` pages and components:

```astro
---
import Typst from "@aaron212/astro-typlet/components/Typst.astro";
---

<p>The energy is <Typst>e = m c^2</Typst>.</p>

<Typst displayMode throwOnError={false}>
  x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)
</Typst>
```

Write Typst math source between the component's tags, without `$` or `$$` delimiters. Inline rendering is the
default; set `displayMode` for a display equation. The component accepts Typlet's `RenderOptions` as props, including
`preamble`, `output`, and `throwOnError`. Multiline formulas can also be written directly between the tags.
Use a string expression for dynamic formulas or source containing characters such as `{` and `<`, which Astro
would otherwise interpret as template syntax:

```astro
<Typst>{"a < b"}</Typst>

<Typst displayMode>{`sum_(i=1)^n i
  = (n(n+1))/2`}</Typst>
```

The component renders on the server and imports Typlet's stylesheet and fonts automatically. It works without the
Astro integration or a Markdown processor. Rendering options passed to `typlet()` configure Markdown and MDX only;
pass options to `Typst` separately. Raw dollar-delimited text in `.astro` templates is left unchanged.

To share equation numbering across components, create an `equationCounter` object (`{ value: 0 }`) in the page's
frontmatter and pass that same object to each `Typst` component. Create a new counter per page render rather than
sharing one at module scope. The integration's `copyTypst: true` script also works with component-rendered formulas.

### Astro + Sätteri

Install this plugin and Astro's configurable Sätteri processor in your Astro project:

```sh
pnpm add @aaron212/astro-typlet @astrojs/markdown-satteri typlet
```

Configure `astro.config.ts`:

```ts
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { prepareTypletMath, renderTypletMath } from "@aaron212/astro-typlet";

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [prepareTypletMath()],
      hastPlugins: [renderTypletMath({ throwOnError: false })],
    }),
  },
});
```

Pass rendering options to `renderTypletMath()`; `prepareTypletMath()` takes no options.

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
import { renderTypletMath } from "@aaron212/astro-typlet";

const markdown = `Inline math: $x^2 + y^2 = z^2$.

$$
sum_(i=1)^n i = (n(n+1))/2
$$
`;

const { html } = markdownToHtml(markdown, {
  features: { math: true },
  hastPlugins: [
    renderTypletMath({
      output: "htmlAndMathml",
      throwOnError: false,
      preamble: '#let norm(x) = $lr(|| #x ||)$\n#set math.equation(numbering: "(1)")',
    }),
  ],
});
```

Pass rendering options to `renderTypletMath()`. The `TypletMathOptions` type is exported from
`@aaron212/astro-typlet`. `copyTypst` is available only through the Astro integration.

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

### Rendering options

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

## Publishing

The GitHub Actions workflow in `.github/workflows/publish.yml` stages releases for tags matching `v*` on npm. It installs
dependencies with the frozen lockfile, checks formatting, linting, and types, then sets the package version from
the tag and builds the package. The committed `package.json` version is a development placeholder; CI updates it
only in the release checkout, without creating a commit or another tag.

Use npm 11.15.0 or newer and enable 2FA on your npm account. For the first release, log in, install dependencies,
build the package, and stage it locally:

```sh
mise exec -- npm login --registry https://registry.npmjs.org
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm build
mise exec -- npm stage publish --access public --registry https://registry.npmjs.org
```

Staging a new package creates a public `0.0.0-stage` placeholder; the staged version's contents become public only
after approval. In the npm package settings, configure a GitHub Actions trusted publisher for user `Aaron-212`,
repository `astro-typlet`, workflow `publish.yml`, and environment `npm`. The publishing job uses the GitHub Actions
environment named `npm`; its name must match the npm trusted publisher configuration exactly. Allow only staging: leave
`npm publish` and dist-tag management permissions disabled.

After committing and pushing the release changes, create and push a version tag:

```sh
git tag v0.0.2
git push origin v0.0.2
```

Use exact SemVer tags such as `v0.0.2` or `v0.1.0-beta.1`. Stable releases use npm's `latest` dist-tag;
prereleases use `next`. Choose a new version for every release, since npm does not allow reusing a published version.

After a local or CI staging run, review and approve the release with 2FA:

```sh
mise exec -- npm stage list @aaron212/astro-typlet
mise exec -- npm stage view <stage-id>
mise exec -- npm stage approve <stage-id>
```

You can also review and approve releases in npm's Staged Packages tab. See the
[staged publishing documentation](https://docs.npmjs.com/staged-publishing/) for details.
