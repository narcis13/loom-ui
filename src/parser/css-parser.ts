// CSS token extractor — extracts var(--token-name) references from CSS files
// and collects defined custom properties from token files

/** A reference to a CSS custom property via var() */
export interface TokenReference {
  /** The token name without -- prefix */
  name: string;
  /** Line number in the source */
  line: number;
  /** The full var() expression */
  expression: string;
}

/** A defined CSS custom property */
export interface TokenDefinition {
  /** The token name without -- prefix */
  name: string;
  /** The value assigned */
  value: string;
  /** Line number in the source */
  line: number;
}

// Match var(--name) or var(--name, fallback)
const VAR_RE = /var\(\s*--([a-zA-Z][\w-]*)\s*(?:,\s*[^)]+)?\)/g;

// Match --name: value; declarations
const PROP_RE = /--([a-zA-Z][\w-]*)\s*:\s*([^;]+);/g;

// Match @media (prefers-reduced-motion: reduce)
const REDUCED_MOTION_RE = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/;

// Match hardcoded color values (hex, rgb, hsl, oklch without var())
const HARDCODED_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(|hsla?\s*\(|oklch\s*\(/g;

/**
 * Extract all var(--token) references from a CSS source string.
 */
export function extractTokenReferences(source: string): TokenReference[] {
  const refs: TokenReference[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("/*")) continue;

    let match: RegExpExecArray | null;
    VAR_RE.lastIndex = 0;
    while ((match = VAR_RE.exec(line)) !== null) {
      refs.push({
        name: match[1],
        line: i + 1,
        expression: match[0],
      });
    }
  }

  return refs;
}

/**
 * Extract all custom property definitions from a CSS source string.
 */
export function extractTokenDefinitions(source: string): TokenDefinition[] {
  const defs: TokenDefinition[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    PROP_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROP_RE.exec(line)) !== null) {
      defs.push({
        name: match[1],
        value: match[2].trim(),
        line: i + 1,
      });
    }
  }

  return defs;
}

/**
 * Check if a CSS file contains a prefers-reduced-motion media query.
 */
export function hasReducedMotionQuery(source: string): boolean {
  return REDUCED_MOTION_RE.test(source);
}

/**
 * Check if a CSS file contains animation or transition properties.
 */
export function hasAnimationProperties(source: string): boolean {
  const lines = source.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith("/*") || trimmed.startsWith("//")) continue;
    // Check for animation/transition properties
    if (/\b(animation|transition)\s*:/.test(trimmed)) return true;
    if (/\b(animation-name|animation-duration|transition-property|transition-duration)\s*:/.test(trimmed)) return true;
  }
  return false;
}

/**
 * Collect all defined token names from one or more CSS sources.
 * Returns a Set of token names (without -- prefix).
 */
export function collectDefinedTokens(sources: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const source of sources) {
    for (const def of extractTokenDefinitions(source)) {
      tokens.add(def.name);
    }
  }
  return tokens;
}
