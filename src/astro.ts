import { isSatteriProcessor } from "@astrojs/markdown-satteri";
import type { AstroIntegration } from "astro";
import { prepareTypletMath, renderTypletMath, type TypletMathOptions } from "./index.js";

export interface AstroTypletOptions extends TypletMathOptions {
  /** Load the browser script that copies formulas as Typst source. Defaults to false. */
  copyTypst?: boolean;
}

/** Configure Typlet math rendering and load its styles in Astro. */
export default function typlet(options: AstroTypletOptions = {}): AstroIntegration {
  const { copyTypst = false, ...renderOptions } = options;
  let configuredProcessor: object | undefined;

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
        processor.options.mdastPlugins.push(prepareTypletMath());
        processor.options.hastPlugins.push(renderTypletMath(renderOptions));
        configuredProcessor = processor.options;

        injectScript("page-ssr", 'import "typlet/fonts/typlet.css";');
        if (copyTypst) {
          injectScript("page", 'import "typlet/contrib/copy-typst";');
        }
      },
      "astro:config:done": ({ config }) => {
        if (config.markdown.processor.options !== configuredProcessor) {
          throw new Error(
            "Another integration replaced the Markdown processor after astro-typlet was configured. " +
              "Place astro-typlet after integrations that configure markdown.processor.",
          );
        }
      },
    },
  };
}
