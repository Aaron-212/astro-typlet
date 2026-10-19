import {
  defineHastPlugin,
  defineMdastPlugin,
  htmlToHast,
  type HastPluginDefinition,
  type MdastNode,
  type MdastPluginDefinition,
  type MdastVisitorContext,
} from "satteri";
import { renderToString, type RenderOptions } from "typlet";

/** Typlet options, with display mode determined by the Markdown math node. */
export type TypletMathOptions = Omit<RenderOptions, "displayMode">;

/** Keep display math out of Astro's code highlighter. Pair with the HAST renderer. */
export function prepareTypletMath(): MdastPluginDefinition {
  function replaceMath(node: Readonly<Extract<MdastNode, { type: "math" | "code" }>>, ctx: MdastVisitorContext) {
    ctx.replaceNode(node, {
      type: "typletMath",
      data: { ...node.data, hName: "div", hProperties: { className: ["math-display"] } },
      children: [{ type: "text", value: node.value }],
    });
  }

  return defineMdastPlugin({
    name: "prepare-typlet-math",
    math: replaceMath,
    code(node, ctx) {
      if (node.lang !== "typlet") {
        return;
      }

      replaceMath(node, ctx);
    },
  });
}

/** Render all Markdown math as Typst. Enable Sätteri's `features.math` when parsing. */
export function renderTypletMath(options: TypletMathOptions = {}): HastPluginDefinition {
  const counters = new WeakMap<object, { value: number }>();

  return defineHastPlugin({
    name: "render-typlet-math",
    element: {
      filter: ["code", "span", "div"],
      visit(node, ctx) {
        const className = node.properties.className;
        const classes = Array.isArray(className) ? className : [];
        const inline = classes.includes("math-inline");
        const display = classes.includes("math-display");
        const languageTyplet = classes.includes("language-typlet");

        if (!inline && !display && !languageTyplet) {
          return;
        }

        let counter = options.equationCounter ?? counters.get(ctx.data);
        if (!counter) {
          counter = { value: 0 };
          counters.set(ctx.data, counter);
        }

        const parent = ctx.parent(node);
        const inPre = node.tagName === "code" && parent.type === "element" && parent.tagName === "pre";
        const html = renderToString(ctx.textContent(node), {
          ...options,
          displayMode: inPre || display,
          equationCounter: counter,
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
