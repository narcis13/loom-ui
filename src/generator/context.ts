import type { LoomConfig } from "../utils/config";

export function generateContext(config: LoomConfig): Record<string, unknown> {
  return {
    generated_at: new Date().toISOString(),
    version: config.version,
    theme: config.theme,
    output_dir: config.output_dir,
    tokens_split: config.tokens_split,
    include_core: config.include_core,
    installed: config.installed,
    paths: {
      tokens: `${config.output_dir}/tokens`,
      base: `${config.output_dir}/base`,
      core: config.include_core ? `${config.output_dir}/core` : null,
      primitives: `${config.output_dir}/primitives`,
      recipes: `${config.output_dir}/recipes`,
      patterns: `${config.output_dir}/patterns`,
    },
  };
}
