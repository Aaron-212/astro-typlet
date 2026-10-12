import {
  defineHastPlugin,
  defineMdastPlugin,
  htmlToHast,
  type HastPluginDefinition,
  type MdastPluginDefinition,
} from "satteri";
import { renderToString, type RenderOptions } from "typlet";

/** Typlet options, with display mode determined by the Markdown math node. */
export type SatteriTypletOptions = Omit<RenderOptions, "displayMode">;

/** Keep display math out of Astro's code highlighter. Pair with the HAST renderer. */
export function prepareTypletMath(): MdastPluginDefinition {
  return defineMdastPlugin({
    name: "prepare-typlet-math",
    math(node, ctx) {
      ctx.replaceNode(node, {
        type: "typletMath",
        data: { ...node.data, hName: "div", hProperties: { className: ["math-display"] } },
        children: [{ type: "text", value: node.value }],
      });
    },
    code(node, ctx) {
      if (node.lang !== "typlet") {
        return;
      }

      ctx.replaceNode(node, {
        type: "typletMath",
        data: { ...node.data, hName: "div", hProperties: { className: ["math-display"] } },
        children: [{ type: "text", value: node.value }],
      });
    },
  });
}

/** Render all Markdown math as Typst. Enable Sätteri's `features.math` when parsing. */
export function renderTypletMath(options: SatteriTypletOptions = {}): HastPluginDefinition {
  const counters = new WeakMap<object, { value: number }>();

  return defineHastPlugin({
    name: "render-typlet-math",
    before(_root, ctx) {
      counters.set(ctx.data, { value: 0 });
    },
    element: {
      filter: ["code", "span", "div"],
      visit(node, ctx) {
        const className = node.properties.className;
        const classes = Array.isArray(className) ? className : [];
        const inline = classes.includes("math-inline");
        const display = classes.includes("math-display");
        const languageMath = classes.includes("language-math");

        if (!inline && !display && !languageMath) {
          return;
        }

        const parent = ctx.parent(node);
        const inPre = node.tagName === "code" && parent.type === "element" && parent.tagName === "pre";
        const html = renderToString(ctx.textContent(node), {
          ...options,
          displayMode: inPre || display,
          equationCounter: options.equationCounter ?? counters.get(ctx.data),
        });
        // Materialize the generated markup so later plugins and JSX compilation can use it.
        const rendered = htmlToHast(html, { fragment: true });
        if (rendered.type === "root") {
          ctx.replaceNode(inPre ? parent : node, rendered.children);
        }
      },
    },
  });
}
