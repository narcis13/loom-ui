import { readJsonFile } from "./fs";

export const LOOM_VERSION = "1.0.0";

type InstalledSet = {
  primitives: string[];
  recipes: string[];
  patterns: string[];
};

export type LoomConfig = {
  version: string;
  theme: string;
  output_dir: string;
  tokens_split: boolean;
  include_core: boolean;
  installed: InstalledSet;
};

type CreateConfigOptions = {
  version?: string;
  theme?: string;
  outputDir?: string;
  tokensSplit?: boolean;
  includeCore?: boolean;
};

export function createDefaultConfig(options: CreateConfigOptions = {}): LoomConfig {
  return {
    version: options.version ?? LOOM_VERSION,
    theme: options.theme ?? "default",
    output_dir: formatOutputDir(options.outputDir ?? "./ui"),
    tokens_split: options.tokensSplit ?? false,
    include_core: options.includeCore ?? true,
    installed: {
      primitives: [],
      recipes: [],
      patterns: [],
    },
  };
}

export async function readConfigFile(path: string): Promise<LoomConfig> {
  const config = await readJsonFile(path);
  const issues = validateConfig(config);

  if (issues.length > 0) {
    throw new Error(`Invalid loom.config.json: ${issues.join("; ")}`);
  }

  return config as LoomConfig;
}

export function validateConfig(value: unknown): string[] {
  const issues: string[] = [];

  if (!isRecord(value)) {
    return ["config must be a JSON object"];
  }

  if (!isNonEmptyString(value.version)) {
    issues.push("version must be a non-empty string");
  }

  if (!isNonEmptyString(value.theme)) {
    issues.push("theme must be a non-empty string");
  }

  if (!isNonEmptyString(value.output_dir)) {
    issues.push("output_dir must be a non-empty string");
  }

  if (typeof value.tokens_split !== "boolean") {
    issues.push("tokens_split must be a boolean");
  }

  if (typeof value.include_core !== "boolean") {
    issues.push("include_core must be a boolean");
  }

  if (!isRecord(value.installed)) {
    issues.push("installed must be an object");
    return issues;
  }

  for (const key of ["primitives", "recipes", "patterns"] as const) {
    const list = value.installed[key];
    if (!Array.isArray(list) || !list.every(isNonEmptyString)) {
      issues.push(`installed.${key} must be an array of strings`);
    }
  }

  return issues;
}

export function formatOutputDir(path: string): string {
  if (path.startsWith("./") || path.startsWith("../") || path.startsWith("/")) {
    return path;
  }

  return `./${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
