import type { LoomConfig } from "./config";
import { readTextFile } from "./fs";
import { type LoomManifest, readManifestFile } from "./manifest";
import { resolvePackagePath, resolveRegistryPath } from "./paths";
import { REGISTRY_LAYERS, type RegistryLayer } from "./registry";
import { TOKEN_FILES, listThemeRecords, resolveThemeCss } from "./theme";

type GalleryComponent = {
  name: string;
  layer: RegistryLayer;
  description: string;
  html: string;
  manifest: LoomManifest;
};

type GalleryThemeOption = {
  name: string;
  label: string;
  source: "built-in" | "project";
  description: string;
};

export async function renderGalleryHtml(projectRoot: string, config: LoomConfig): Promise<string> {
  const sections = await Promise.all(
    REGISTRY_LAYERS.map(async (layer) => ({
      layer,
      components: await Promise.all(
        config.installed[layer].map(async (name) => await readGalleryComponent(projectRoot, config, layer, name)),
      ),
    })),
  );
  const totalComponents = sections.reduce((sum, section) => sum + section.components.length, 0);
  const tokenCss = await renderGalleryTokenCss();
  const themeOptions = await listGalleryThemes(projectRoot, config);
  const themeCss = await renderGalleryThemeCss(projectRoot, config, themeOptions);
  const initialTheme = selectInitialTheme(config.theme, themeOptions);
  const cssLinks = [
    "./base/reset.css",
    "./base/prose.css",
    ...config.installed.primitives.map((name) => `./primitives/${name}/${name}.css`),
    ...config.installed.recipes.map((name) => `./recipes/${name}/${name}.css`),
    ...config.installed.patterns.map((name) => `./patterns/${name}/${name}.css`),
  ];

  return [
    "<!doctype html>",
    `<html lang="en" data-theme="${escapeHtml(initialTheme)}">`,
    "  <head>",
    "    <meta charset=\"utf-8\" />",
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
    "    <title>Loom component gallery</title>",
    ...cssLinks.map((href) => `    <link rel="stylesheet" href="${href}" />`),
    "    <style>",
    tokenCss.trimEnd(),
    "",
    themeCss.trimEnd(),
    "",
    "      body {",
    "        margin: 0;",
    "        background:",
    "          radial-gradient(circle at top, var(--color-primary-subtle), transparent 32rem),",
      "          linear-gradient(180deg, var(--color-bg-subtle), var(--color-bg));",
    "        color: var(--color-fg);",
    "        font-family: var(--font-sans);",
    "      }",
    "      [data-gallery] {",
    "        display: grid;",
    "        gap: var(--space-8);",
    "        padding: var(--space-8) var(--space-6) var(--space-8);",
    "      }",
    "      [data-gallery-part=\"hero\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "      }",
    "      [data-gallery-part=\"eyebrow\"] {",
    "        margin: 0;",
    "        color: var(--color-primary);",
    "        font-size: var(--text-xs);",
    "        font-weight: var(--weight-semibold);",
    "        letter-spacing: var(--tracking-wide);",
    "        text-transform: uppercase;",
    "      }",
    "      [data-gallery-part=\"hero\"] h1,",
    "      [data-gallery-part=\"hero\"] p,",
    "      [data-gallery-part=\"section-header\"] h2,",
    "      [data-gallery-part=\"section-header\"] p,",
    "      [data-gallery-part=\"component-header\"] h3,",
    "      [data-gallery-part=\"component-header\"] p {",
    "        margin: 0;",
    "      }",
    "      [data-gallery-part=\"hero\"] h1 {",
    "        font-size: clamp(2.5rem, 5vw, 4.5rem);",
    "        line-height: 0.95;",
    "      }",
    "      [data-gallery-part=\"hero\"] p {",
    "        max-inline-size: 52rem;",
    "        color: var(--color-fg-muted);",
    "        font-size: var(--text-base);",
    "      }",
    "      [data-gallery-part=\"summary\"] {",
    "        display: flex;",
    "        flex-wrap: wrap;",
    "        gap: var(--space-3);",
    "      }",
    "      [data-gallery-part=\"toolbar\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "        padding: var(--space-4);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--radius-xl);",
    "        background: color-mix(in oklch, var(--color-bg-elevated) 94%, transparent);",
    "        box-shadow: var(--shadow-xs);",
    "      }",
    "      [data-gallery-part=\"toolbar-header\"] {",
    "        display: grid;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"pill\"] {",
    "        display: inline-flex;",
    "        align-items: center;",
    "        min-block-size: var(--button-height-sm);",
    "        padding-inline: var(--space-3);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--radius-full);",
    "        background: var(--color-bg-elevated);",
    "        color: var(--color-fg-muted);",
    "        font-size: var(--text-sm);",
    "        font-weight: var(--weight-medium);",
    "      }",
    "      [data-gallery-part=\"nav\"] {",
    "        display: flex;",
    "        flex-wrap: wrap;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"nav\"] a {",
    "        color: var(--color-link);",
    "        font-weight: var(--weight-medium);",
    "        text-decoration: none;",
    "      }",
    "      [data-gallery-part=\"control-grid\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "      }",
    "      [data-gallery-part=\"control-row\"] {",
    "        display: grid;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"control-row\"] label,",
    "      [data-gallery-part=\"feature-title\"] {",
    "        font-size: var(--text-xs);",
    "        font-weight: var(--weight-semibold);",
    "        letter-spacing: var(--tracking-wide);",
    "        text-transform: uppercase;",
    "        color: var(--color-fg-muted);",
    "      }",
    "      [data-gallery-part=\"theme-controls\"] {",
    "        display: flex;",
    "        flex-wrap: wrap;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-theme-button] {",
    "        display: inline-flex;",
    "        align-items: center;",
    "        justify-content: center;",
    "        gap: var(--space-2);",
    "        min-block-size: var(--button-height-md);",
    "        padding-inline: var(--space-3);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--radius-full);",
    "        background: var(--color-bg);",
    "        color: var(--color-fg);",
    "        font: inherit;",
    "        cursor: pointer;",
    "        transition:",
    "          background-color var(--duration-fast) var(--ease-default),",
    "          border-color var(--duration-fast) var(--ease-default),",
    "          color var(--duration-fast) var(--ease-default);",
    "      }",
    "      [data-gallery-theme-button][aria-pressed=\"true\"] {",
    "        border-color: var(--color-primary);",
    "        background: var(--color-primary);",
    "        color: var(--color-primary-fg);",
    "      }",
    "      [data-gallery-theme-button-source] {",
    "        font-size: var(--text-xs);",
    "        color: inherit;",
    "        opacity: 0.72;",
    "      }",
    "      [data-gallery-filter] {",
    "        inline-size: 100%;",
    "        min-block-size: var(--button-height-md);",
    "        padding: 0 var(--space-3);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--input-radius);",
    "        background: var(--color-bg);",
    "        color: var(--color-fg);",
    "        font: inherit;",
    "      }",
    "      [data-gallery-part=\"protocol\"] {",
    "        display: grid;",
    "        gap: var(--space-3);",
    "        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));",
    "      }",
    "      [data-gallery-part=\"protocol-card\"] {",
    "        display: grid;",
    "        gap: var(--space-2);",
    "        padding: var(--space-3);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--radius-lg);",
    "        background: var(--color-bg);",
    "      }",
    "      [data-gallery-part=\"protocol-card\"] code {",
    "        font-size: var(--text-sm);",
    "        font-weight: var(--weight-semibold);",
    "      }",
    "      [data-gallery-part=\"sections\"] {",
    "        display: grid;",
    "        gap: var(--space-8);",
    "      }",
    "      [data-gallery-part=\"section\"] {",
    "        display: grid;",
    "        gap: var(--space-5);",
    "      }",
    "      [data-gallery-part=\"section-header\"] {",
    "        display: grid;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"section-header\"] p {",
    "        color: var(--color-fg-muted);",
    "      }",
    "      [data-gallery-part=\"grid\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));",
    "      }",
    "      [data-gallery-part=\"card\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "        padding: var(--space-4);",
    "        border: var(--space-px) solid var(--color-border);",
    "        border-radius: var(--radius-xl);",
    "        background: color-mix(in oklch, var(--color-bg-elevated) 92%, transparent);",
    "        box-shadow: var(--shadow-xs);",
    "        overflow: hidden;",
    "      }",
    "      [data-gallery-part=\"component-header\"] {",
    "        display: grid;",
    "        gap: var(--space-1);",
    "      }",
    "      [data-gallery-part=\"component-header\"] p {",
    "        color: var(--color-fg-muted);",
    "      }",
    "      [data-gallery-part=\"meta\"] {",
    "        display: flex;",
    "        flex-wrap: wrap;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"meta\"] span {",
    "        display: inline-flex;",
    "        align-items: center;",
    "        min-block-size: var(--button-height-sm);",
    "        padding-inline: var(--space-2);",
    "        border-radius: var(--radius-full);",
    "        background: var(--color-bg-muted);",
    "        color: var(--color-fg-muted);",
    "        font-size: var(--text-xs);",
    "      }",
    "      [data-gallery-part=\"canvas\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "        padding: var(--space-4);",
        "        border: var(--space-px) dashed var(--color-border);",
    "        border-radius: var(--radius-lg);",
    "        background: var(--color-bg);",
    "      }",
    "      [data-gallery-part=\"canvas\"][data-kind=\"pattern\"] {",
    "        padding: 0;",
    "        border-style: solid;",
    "      }",
    "      [data-gallery-part=\"contract\"] {",
    "        border-top: var(--space-px) solid var(--color-border);",
    "        padding-top: var(--space-4);",
    "      }",
    "      [data-gallery-part=\"contract\"] summary {",
    "        cursor: pointer;",
    "        font-weight: var(--weight-semibold);",
    "      }",
    "      [data-gallery-part=\"contract-grid\"] {",
    "        display: grid;",
    "        gap: var(--space-4);",
    "        margin-top: var(--space-4);",
    "      }",
    "      [data-gallery-part=\"feature-group\"] {",
    "        display: grid;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"chips\"] {",
    "        display: flex;",
    "        flex-wrap: wrap;",
    "        gap: var(--space-2);",
    "      }",
    "      [data-gallery-part=\"chip\"] {",
    "        display: inline-flex;",
    "        align-items: center;",
    "        min-block-size: var(--button-height-sm);",
    "        padding-inline: var(--space-2);",
    "        border-radius: var(--radius-full);",
    "        background: var(--color-bg-muted);",
    "        color: var(--color-fg);",
    "        font-size: var(--text-sm);",
    "      }",
    "      [data-gallery-part=\"empty\"] {",
    "        color: var(--color-fg-muted);",
    "        font-size: var(--text-sm);",
    "      }",
    "      [data-gallery-part=\"section\"][hidden],",
    "      [data-gallery-part=\"card\"][hidden] {",
    "        display: none;",
    "      }",
    "      @media (max-width: 48rem) {",
    "        [data-gallery] {",
    "          padding-inline: var(--space-4);",
    "        }",
    "      }",
    "    </style>",
    "  </head>",
    "  <body>",
    "    <main data-gallery>",
    "      <header data-gallery-part=\"hero\">",
    "        <p data-gallery-part=\"eyebrow\">Loom UI</p>",
    "        <h1>Component gallery</h1>",
    "        <p>Self-hosted browser testbench for every primitive, recipe, and pattern shipped by Loom. Switch themes live, filter the registry, and inspect each component contract without leaving the page.</p>",
    "        <div data-gallery-part=\"summary\">",
    `          <span data-gallery-part="pill">${totalComponents} components</span>`,
    ...sections.map(
      (section) =>
        `          <span data-gallery-part="pill">${section.layer}: ${section.components.length}</span>`,
    ),
    `          <span data-gallery-part="pill">${themeOptions.length} themes</span>`,
    "        </div>",
        "        <nav data-gallery-part=\"nav\" aria-label=\"Gallery sections\">",
    ...sections.map(
      (section) =>
        `          <a href="#gallery-${section.layer}">${section.layer}</a>`,
    ),
    "        </nav>",
    "      </header>",
    "      <section data-gallery-part=\"toolbar\" aria-label=\"Gallery controls\">",
    "        <header data-gallery-part=\"toolbar-header\">",
    "          <p data-gallery-part=\"eyebrow\">Browser controls</p>",
    "          <h2>Theme, filter, and protocol</h2>",
    "          <p>Every component here runs against the same DOM contract from LOOM-SPEC: <code>data-ui</code>, <code>data-part</code>, <code>data-state</code>, <code>data-variant</code>, and <code>data-size</code>.</p>",
    "        </header>",
    "        <div data-gallery-part=\"control-grid\">",
    "          <div data-gallery-part=\"control-row\">",
    "            <label for=\"gallery-filter\">Filter components</label>",
    "            <input",
    "              id=\"gallery-filter\"",
    "              data-gallery-filter",
    "              type=\"search\"",
    "              placeholder=\"Search names, layers, variants, states, or dependencies\"",
    "              aria-label=\"Component filter\"",
    "            />",
    "          </div>",
    "          <div data-gallery-part=\"control-row\">",
    "            <label>Theme switcher</label>",
    "            <div data-gallery-part=\"theme-controls\" data-gallery-theme-controls role=\"group\" aria-label=\"Theme switcher\">",
    ...themeOptions.map(
      (theme) =>
        [
          `              <button type="button" data-gallery-theme-button="${escapeHtml(theme.name)}" aria-pressed="${theme.name === initialTheme ? "true" : "false"}" title="${escapeHtml(theme.description)}">`,
          `                <span>${escapeHtml(theme.label)}</span>`,
          `                <span data-gallery-theme-button-source>${escapeHtml(theme.source)}</span>`,
          "              </button>",
        ].join("\n"),
    ),
    "            </div>",
    "          </div>",
    "          <div data-gallery-part=\"control-row\">",
    "            <label>Attribute protocol</label>",
    "            <div data-gallery-part=\"protocol\">",
    "              <article data-gallery-part=\"protocol-card\"><code>data-ui</code><p>Component identity on the root node.</p></article>",
    "              <article data-gallery-part=\"protocol-card\"><code>data-part</code><p>Named slot inside a component contract.</p></article>",
    "              <article data-gallery-part=\"protocol-card\"><code>data-state</code><p>Runtime state changed by controllers.</p></article>",
    "              <article data-gallery-part=\"protocol-card\"><code>data-variant</code><p>Visual variant selected in markup.</p></article>",
    "              <article data-gallery-part=\"protocol-card\"><code>data-size</code><p>Size variant kept separate from tone.</p></article>",
    "            </div>",
    "          </div>",
    "        </div>",
    "      </section>",
    "      <div data-gallery-part=\"sections\">",
    ...sections.map((section) =>
      [
        `        <section data-gallery-part="section" id="gallery-${section.layer}">`,
        "          <header data-gallery-part=\"section-header\">",
        `            <p data-gallery-part="eyebrow">${section.layer}</p>`,
        `            <h2>${titleCase(section.layer)}</h2>`,
        `            <p>${describeLayer(section.layer)}</p>`,
        "          </header>",
        "          <div data-gallery-part=\"grid\">",
        ...section.components.map((component) =>
          [
            `            <article data-gallery-part="card" data-kind="${component.layer}" data-name="${escapeHtml(component.name)}" data-search="${escapeHtml(buildSearchText(component))}">`,
            "              <header data-gallery-part=\"component-header\">",
            `                <h3>${escapeHtml(component.name)}</h3>`,
            `                <p>${escapeHtml(component.description)}</p>`,
            "                <div data-gallery-part=\"meta\">",
            `                  <span>${escapeHtml(component.layer)}</span>`,
            `                  <span>${escapeHtml(component.manifest.category)}</span>`,
            `                  <span>${escapeHtml(component.manifest.anatomy.selector)}</span>`,
            ...(component.manifest.files.js
              ? [`                  <span>${escapeHtml(component.manifest.files.js)}</span>`]
              : []),
            "                </div>",
            "              </header>",
            `              <div data-gallery-part="canvas" data-kind="${component.layer}">`,
            ...component.html.trim().split("\n").map((line) => `                ${line}`),
            "              </div>",
            renderComponentContract(component)
              .split("\n")
              .map((line) => `              ${line}`)
              .join("\n"),
            "            </article>",
          ].join("\n"),
        ),
        "          </div>",
        "        </section>",
      ].join("\n"),
    ),
    "      </div>",
    "    </main>",
    "    <script>",
    "      const root = document.documentElement;",
    "      const filterInput = document.querySelector(\"[data-gallery-filter]\");",
    "      const cards = [...document.querySelectorAll('[data-gallery-part=\"card\"]')];",
    "      const sectionsList = [...document.querySelectorAll('[data-gallery-part=\"section\"]')];",
    "      const themeButtons = [...document.querySelectorAll(\"[data-gallery-theme-button]\")];",
    "      const availableThemes = new Set(themeButtons.map((button) => button.getAttribute(\"data-gallery-theme-button\")));",
    "",
    "      function applyTheme(themeName) {",
    "        if (!availableThemes.has(themeName)) {",
    "          return;",
    "        }",
    "",
    "        root.setAttribute(\"data-theme\", themeName);",
    "        themeButtons.forEach((button) => {",
    "          button.setAttribute(",
    "            \"aria-pressed\",",
    "            button.getAttribute(\"data-gallery-theme-button\") === themeName ? \"true\" : \"false\",",
    "          );",
    "        });",
    "",
    "        try {",
    "          window.localStorage.setItem(\"loom-gallery-theme\", themeName);",
    "        } catch (_error) {",
    "          // Ignore storage failures when opened from locked-down file origins.",
    "        }",
    "      }",
    "",
    "      function applyFilter() {",
    "        const query = (filterInput?.value ?? \"\").trim().toLowerCase();",
    "",
    "        cards.forEach((card) => {",
    "          const haystack = (card.getAttribute(\"data-search\") ?? \"\").toLowerCase();",
    "          card.hidden = query.length > 0 && !haystack.includes(query);",
    "        });",
    "",
    "        sectionsList.forEach((section) => {",
    "          section.hidden = !section.querySelector('[data-gallery-part=\"card\"]:not([hidden])');",
    "        });",
    "      }",
    "",
    "      themeButtons.forEach((button) => {",
    "        button.addEventListener(\"click\", () => {",
    "          const themeName = button.getAttribute(\"data-gallery-theme-button\");",
    "",
    "          if (themeName) {",
    "            applyTheme(themeName);",
    "          }",
    "        });",
    "      });",
    "",
    "      filterInput?.addEventListener(\"input\", applyFilter);",
    "",
    "      try {",
    "        const storedTheme = window.localStorage.getItem(\"loom-gallery-theme\");",
    "        applyTheme(storedTheme && availableThemes.has(storedTheme) ? storedTheme : root.getAttribute(\"data-theme\") ?? \"default\");",
    "      } catch (_error) {",
    "        applyTheme(root.getAttribute(\"data-theme\") ?? \"default\");",
    "      }",
    "",
    "      applyFilter();",
    "    </script>",
    "    <script type=\"module\" src=\"./loom.js\"></script>",
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}

async function readGalleryComponent(
  projectRoot: string,
  config: LoomConfig,
  layer: RegistryLayer,
  name: string,
): Promise<GalleryComponent> {
  const componentDir = resolvePackagePath(projectRoot, config.output_dir, layer, name);
  const manifest = await readManifestFile(resolvePackagePath(componentDir, `${name}.manifest.json`));

  return {
    name,
    layer,
    description: manifest.description,
    html: await readTextFile(resolvePackagePath(componentDir, manifest.files.html)),
    manifest,
  };
}

async function renderGalleryTokenCss(): Promise<string> {
  const tokenContents = await Promise.all(
    TOKEN_FILES.map(async (fileName) => await readTextFile(resolveRegistryPath("tokens", fileName))),
  );

  return tokenContents.join("\n\n");
}

async function listGalleryThemes(projectRoot: string, config: LoomConfig): Promise<GalleryThemeOption[]> {
  const records = await listThemeRecords(projectRoot, config);
  const options: GalleryThemeOption[] = [
    {
      name: "default",
      label: "default",
      source: "built-in",
      description: "Default semantic light theme.",
    },
    {
      name: "dark",
      label: "dark",
      source: "built-in",
      description: "Default semantic dark override from the bundled default theme.",
    },
  ];

  for (const record of records) {
    if (record.name === "default") {
      continue;
    }

    options.push({
      name: record.name,
      label: record.name,
      source: record.source,
      description: describeTheme(record.name, record.source),
    });
  }

  return options;
}

async function renderGalleryThemeCss(
  projectRoot: string,
  config: LoomConfig,
  themeOptions: GalleryThemeOption[],
): Promise<string> {
  const cssParts = [
    "html {",
    "  color-scheme: light;",
    "}",
  ];
  const defaultThemeCss = await resolveThemeCss(projectRoot, config, "default");
  const darkRule = extractCssBlock(defaultThemeCss, '[data-theme=\"dark\"]');

  if (darkRule) {
    cssParts.push(darkRule.replace(/\[data-theme=\"dark\"\]/g, 'html[data-theme=\"dark\"]'));
  }

  for (const theme of themeOptions) {
    if (theme.name === "default" || theme.name === "dark") {
      continue;
    }

    cssParts.push(scopeThemeCss(await resolveThemeCss(projectRoot, config, theme.name), theme.name));
  }

  return cssParts.join("\n\n");
}

function selectInitialTheme(configTheme: string, themeOptions: GalleryThemeOption[]): string {
  return themeOptions.some((theme) => theme.name === configTheme) ? configTheme : "default";
}

function scopeThemeCss(source: string, themeName: string): string {
  return source.replace(/:root/g, `html[data-theme="${themeName}"]`);
}

function extractCssBlock(source: string, selector: string): string | null {
  const selectorStart = source.indexOf(selector);

  if (selectorStart === -1) {
    return null;
  }

  const blockStart = source.indexOf("{", selectorStart);

  if (blockStart === -1) {
    return null;
  }

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
      continue;
    }

    if (source[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(selectorStart, index + 1);
      }
    }
  }

  return null;
}

function renderComponentContract(component: GalleryComponent): string {
  const slots = Object.entries(component.manifest.slots ?? {})
    .map(([name, slot]) => `${name}${slot.required ? " required" : " optional"}`);
  const variants = Object.entries(component.manifest.variants ?? {})
    .map(([name, variant]) => `${name}: ${variant.values.join(" | ")}`);
  const states = Object.entries(component.manifest.states ?? {})
    .map(([name, state]) => {
      const flags = [
        state.default ? "default" : "",
        state.transient ? "transient" : "",
      ].filter(Boolean);

      return flags.length > 0 ? `${name} (${flags.join(", ")})` : name;
    });
  const safeTransforms = component.manifest.safe_transforms;
  const dependencies = component.manifest.composition.contains;
  const usedIn = component.manifest.composition.used_in;
  const tokens = component.manifest.tokens_used;

  return [
    "<details data-gallery-part=\"contract\">",
    "  <summary>Contract</summary>",
    "  <div data-gallery-part=\"contract-grid\">",
    renderFeatureGroup("slots", slots),
    renderFeatureGroup("variants", variants),
    renderFeatureGroup("states", states),
    renderFeatureGroup("safe transforms", safeTransforms),
    renderFeatureGroup("contains", dependencies),
    renderFeatureGroup("used in", usedIn),
    renderFeatureGroup("tokens", tokens),
    "  </div>",
    "</details>",
  ].join("\n");
}

function renderFeatureGroup(title: string, values: string[]): string {
  if (values.length === 0) {
    return [
      "    <section data-gallery-part=\"feature-group\">",
      `      <p data-gallery-part="feature-title">${escapeHtml(title)}</p>`,
      "      <p data-gallery-part=\"empty\">None</p>",
      "    </section>",
    ].join("\n");
  }

  return [
    "    <section data-gallery-part=\"feature-group\">",
    `      <p data-gallery-part="feature-title">${escapeHtml(title)}</p>`,
    "      <div data-gallery-part=\"chips\">",
    ...values.map((value) => `        <span data-gallery-part="chip">${escapeHtml(value)}</span>`),
    "      </div>",
    "    </section>",
  ].join("\n");
}

function buildSearchText(component: GalleryComponent): string {
  const slotNames = Object.keys(component.manifest.slots ?? {});
  const variants = Object.entries(component.manifest.variants ?? {}).flatMap(([name, variant]) => [
    name,
    ...variant.values,
  ]);
  const states = Object.keys(component.manifest.states ?? {});

  return [
    component.name,
    component.layer,
    component.description,
    component.manifest.category,
    component.manifest.anatomy.selector,
    ...slotNames,
    ...variants,
    ...states,
    ...component.manifest.safe_transforms,
    ...component.manifest.composition.contains,
    ...component.manifest.composition.used_in,
  ].join(" ");
}

function describeTheme(name: string, source: "built-in" | "project"): string {
  switch (name) {
    case "midnight":
      return "High-contrast dark theme tuned for dashboard-style surfaces.";
    case "paper":
      return "Warm editorial theme with softer neutrals and restrained contrast.";
    case "brutalist":
      return "Sharp, high-contrast theme with squared corners and hard shadows.";
    default:
      return source === "project"
        ? "Project-defined custom theme."
        : "Bundled theme shipped with the registry.";
  }
}

function describeLayer(layer: RegistryLayer): string {
  switch (layer) {
    case "primitives":
      return "Single-purpose building blocks with a strict DOM contract.";
    case "recipes":
      return "Interactive compositions that attach small controllers to existing markup.";
    case "patterns":
      return "Full page regions assembled from Loom primitives and recipes.";
  }
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
