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
export interface TypletMathOptions extends Omit<RenderOptions, "displayMode"> {
  /** Markdown syntax to render as Typst. Defaults to both. */
  syntax?: "math" | "typlet" | "both";
}

/** Keep display math out of Astro's code highlighter. Pair with the HAST renderer. */
export function prepareTypletMath({ syntax = "both" }: Pick<TypletMathOptions, "syntax"> = {}): MdastPluginDefinition {
  function replaceMath(node: Readonly<Extract<MdastNode, { type: "math" | "code" }>>, ctx: MdastVisitorContext) {
    ctx.replaceNode(node, {
      type: "typletMath",
      data: {
        ...node.data,
        hName: "div",
        hProperties: { className: [node.type === "code" ? "typlet-display" : "math-display"] },
      },
      children: [{ type: "text", value: node.value }],
    });
  }

  return defineMdastPlugin({
    name: "prepare-typlet-math",
    math(node, ctx) {
      if (syntax !== "typlet") {
        replaceMath(node, ctx);
      }
    },
    code(node, ctx) {
      if (syntax === "math" || node.lang !== "typlet") {
        return;
      }

      replaceMath(node, ctx);
    },
  });
}

/** Render selected Markdown syntax as Typst. Enable Sätteri's `features.math` for dollar delimiters. */
export function renderTypletMath(options: TypletMathOptions = {}): HastPluginDefinition {
  const { syntax = "both", ...renderOptions } = options;
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
        const typletDisplay = classes.includes("typlet-display");
        const typlet = typletDisplay || classes.includes("language-typlet");

        if (!((syntax !== "typlet" && (inline || display)) || (syntax !== "math" && typlet))) {
          return;
        }

        let counter = renderOptions.equationCounter ?? counters.get(ctx.data);
        if (!counter) {
          counter = { value: 0 };
          counters.set(ctx.data, counter);
        }

        const parent = ctx.parent(node);
        const inPre = node.tagName === "code" && parent.type === "element" && parent.tagName === "pre";
        const html = renderToString(ctx.textContent(node), {
          ...renderOptions,
          displayMode: inPre || display || typletDisplay,
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
