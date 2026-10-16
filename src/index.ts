import { isSatteriProcessor } from "@astrojs/markdown-satteri";
import type { AstroIntegration } from "astro";
import { prepareTypletMath, renderTypletMath, type TypletMathOptions } from "./satteri.js";

export interface AstroTypletOptions extends TypletMathOptions {
  /** Load the browser script that copies formulas as Typst source. Defaults to false. */
  copyTypst?: boolean;
}

/** Configure Typlet math rendering and load its styles in Astro. */
export default function typlet(options: AstroTypletOptions = {}): AstroIntegration {
  const { copyTypst = false, ...renderOptions } = options;
  const preparePlugin = prepareTypletMath();
  const renderPlugin = renderTypletMath(renderOptions);

  return {
    name: "astro-typlet",
    hooks: {
      "astro:config:setup": ({ config, injectScript }) => {
        const processor = config.markdown.processor;
        if (!isSatteriProcessor(processor)) {
          throw new Error(
            "astro-typlet requires the Sätteri Markdown processor. Configure markdown.processor with satteri() " +
              "from @astrojs/markdown-satteri before adding the integration.",
          );
        }

        processor.options.features.math = true;
        processor.options.mdastPlugins.push(preparePlugin);
        processor.options.hastPlugins.push(renderPlugin);

        injectScript("page-ssr", 'import "typlet/fonts/typlet.css";');
        if (copyTypst) {
          injectScript("page", 'import "typlet/contrib/copy-typst";');
        }
      },
      "astro:config:done": ({ config }) => {
        const processor = config.markdown.processor;
        if (
          !isSatteriProcessor(processor) ||
          processor.options.features.math !== true ||
          !processor.options.mdastPlugins.includes(preparePlugin) ||
          !processor.options.hastPlugins.includes(renderPlugin)
        ) {
          throw new Error(
            "Another integration removed astro-typlet's plugins or disabled Sätteri math support. " +
              "Place astro-typlet after integrations that configure markdown.processor.",
          );
        }
      },
    },
  };
}
