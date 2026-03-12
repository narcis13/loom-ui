import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SRC_DIR, "..", "..");

export function resolvePackagePath(...segments: string[]): string {
  return join(...segments);
}

export function resolveRegistryPath(...segments: string[]): string {
  return join(PACKAGE_ROOT, "registry", ...segments);
}
