#!/usr/bin/env node
/**
 * For each locale JSON, lists:
 *   - message keys not referenced in app/src code (likely unused)
 *   - keys referenced in code but missing from that locale file
 *
 * Usage: node scripts/check-locale-keys.mjs [--fail-on-unused] [--fail-on-missing]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const LOCALES_DIR = path.join(APP_ROOT, "src/locales");
const SCAN_DIRS = [path.join(APP_ROOT, "app"), path.join(APP_ROOT, "src")];

const failOnUnused = process.argv.includes("--fail-on-unused");
const failOnMissing = process.argv.includes("--fail-on-missing");

const flattenLeaves = (value, prefix = "") => {
  const keys = [];
  if (value === null || typeof value !== "object") {
    if (prefix) {
      keys.push(prefix);
    }
    return keys;
  }
  if (Array.isArray(value)) {
    if (prefix) {
      keys.push(prefix);
    }
    return keys;
  }
  for (const [k, v] of Object.entries(value)) {
    const p = prefix ? `${prefix}.${k}` : k;
    keys.push(...flattenLeaves(v, p));
  }
  return keys;
};

const collectSourceFiles = (dir, acc = []) => {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") {
        continue;
      }
      collectSourceFiles(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
};

const joinNs = (ns, key) => {
  if (!ns) {
    return key;
  }
  return `${ns}.${key}`;
};

const extractTranslationBindings = (content) => {
  const map = new Map();

  const useRe =
    /(?:const|let)\s+(\w+)\s*=\s*useTranslations\(\s*(?:["']([^"']+)["'])?\s*\)/g;
  let m;
  while ((m = useRe.exec(content)) !== null) {
    map.set(m[1], m[2] ?? "");
  }

  const getRe = /(?:const|let)\s+(\w+)\s*=\s*await\s+getTranslations\(\s*\{([^}]*)\}\s*\)/gs;
  while ((m = getRe.exec(content)) !== null) {
    const body = m[2];
    const nsMatch = body.match(/namespace:\s*["']([^"']+)["']/);
    map.set(m[1], nsMatch ? nsMatch[1] : "");
  }

  return map;
};

const extractStringArgKeys = (content, bindings) => {
  const used = new Set();

  const richRe = /\b(\w+)\.rich\(\s*["']([^"']+)["']/g;
  let mm;
  while ((mm = richRe.exec(content)) !== null) {
    const callee = mm[1];
    const key = mm[2];
    if (!bindings.has(callee) || key.includes("${")) {
      continue;
    }
    used.add(joinNs(bindings.get(callee), key));
  }

  const tRe = /\b(\w+)\(\s*["']([a-zA-Z0-9_.]+)["']/g;
  while ((mm = tRe.exec(content)) !== null) {
    const callee = mm[1];
    const key = mm[2];
    if (!bindings.has(callee) || key.includes("${")) {
      continue;
    }
    used.add(joinNs(bindings.get(callee), key));
  }

  return used;
};

const extractArrayLiteral = (fileContent, constName) => {
  const re = new RegExp(
    `const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`,
    "m",
  );
  const match = fileContent.match(re);
  if (!match) {
    return [];
  }
  const inner = match[1];
  const strings = [];
  const strRe = /"([^"]+)"/g;
  let sm;
  while ((sm = strRe.exec(inner)) !== null) {
    strings.push(sm[1]);
  }
  return strings;
};

const extractPageKeysFromMetadata = (metadataTs) => {
  const m = metadataTs.match(
    /const\s+PAGE_KEYS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/,
  );
  if (!m) {
    return ["home", "about", "login", "register", "activate"];
  }
  const keys = [];
  const strRe = /"([^"]+)"/g;
  let sm;
  while ((sm = strRe.exec(m[1])) !== null) {
    keys.push(sm[1]);
  }
  return keys.length ? keys : ["home", "about", "login", "register", "activate"];
};

const markSubtree = (usedSet, allKeys, prefix) => {
  for (const k of allKeys) {
    if (k === prefix || k.startsWith(`${prefix}.`)) {
      usedSet.add(k);
    }
  }
};

const readFile = (p) => fs.readFileSync(p, "utf8");

const main = () => {
  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (localeFiles.length === 0) {
    console.error(`No JSON files in ${LOCALES_DIR}`);
    process.exit(1);
  }

  const sourceFiles = SCAN_DIRS.flatMap((d) => collectSourceFiles(d));
  const sourceBlob = sourceFiles.map(readFile).join("\n\n");

  const bindingsPerFile = new Map();
  for (const f of sourceFiles) {
    bindingsPerFile.set(f, extractTranslationBindings(readFile(f)));
  }

  const usedKeys = new Set();
  for (const f of sourceFiles) {
    const content = readFile(f);
    const bindings = bindingsPerFile.get(f);
    for (const k of extractStringArgKeys(content, bindings)) {
      usedKeys.add(k);
    }
  }

  const metadataPath = path.join(APP_ROOT, "src/i18n/metadata.ts");
  const metadataContent = readFile(metadataPath);
  const pageKeys = extractPageKeysFromMetadata(metadataContent);
  usedKeys.add("metadata.title");
  usedKeys.add("metadata.description");
  for (const pk of pageKeys) {
    usedKeys.add(`metadata.pages.${pk}.title`);
    usedKeys.add(`metadata.pages.${pk}.description`);
  }

  const termsPath = path.join(
    APP_ROOT,
    "app/[locale]/(marketing)/terms/page.tsx",
  );
  const privacyPath = path.join(
    APP_ROOT,
    "app/[locale]/(marketing)/privacy/page.tsx",
  );

  const referenceJsonPath = path.join(
    LOCALES_DIR,
    localeFiles.includes("pl.json") ? "pl.json" : localeFiles[0],
  );
  const referenceKeys = new Set(flattenLeaves(JSON.parse(readFile(referenceJsonPath))));

  if (fs.existsSync(termsPath)) {
    const termsSrc = readFile(termsPath);
    for (const id of extractArrayLiteral(termsSrc, "termsSections")) {
      markSubtree(
        usedKeys,
        referenceKeys,
        `legal.termsAndConditions.sections.${id}`,
      );
    }
  }

  if (fs.existsSync(privacyPath)) {
    const privacySrc = readFile(privacyPath);
    for (const id of extractArrayLiteral(privacySrc, "privacySections")) {
      markSubtree(usedKeys, referenceKeys, `legal.privacyPolicy.sections.${id}`);
    }
    for (const id of extractArrayLiteral(privacySrc, "cookieSections")) {
      markSubtree(usedKeys, referenceKeys, `legal.cookiePolicy.sections.${id}`);
    }
  }

  markSubtree(usedKeys, referenceKeys, "legal.termsAndConditions");
  markSubtree(usedKeys, referenceKeys, "legal.privacyPolicy");
  markSubtree(usedKeys, referenceKeys, "legal.cookiePolicy");
  markSubtree(usedKeys, referenceKeys, "legal.cookieConsent");
  markSubtree(usedKeys, referenceKeys, "legal.common");

  let exitCode = 0;

  for (const file of localeFiles) {
    const full = path.join(LOCALES_DIR, file);
    const data = JSON.parse(readFile(full));
    const defined = new Set(flattenLeaves(data));

    const unused = [...defined].filter((k) => !usedKeys.has(k)).sort();
    const missing = [...usedKeys].filter((k) => !defined.has(k)).sort();

    console.log(`\n=== ${file} ===`);
    console.log(`Defined: ${defined.size} | Used (global scan): ${usedKeys.size}`);
    console.log(`Unused in code (${unused.length}):`);
    if (unused.length === 0) {
      console.log("  (none)");
    } else {
      unused.forEach((k) => console.log(`  - ${k}`));
      if (failOnUnused) {
        exitCode = 1;
      }
    }
    console.log(`Missing in ${file} (${missing.length}):`);
    if (missing.length === 0) {
      console.log("  (none)");
    } else {
      missing.forEach((k) => console.log(`  - ${k}`));
      if (failOnMissing) {
        exitCode = 1;
      }
    }
  }

  console.log(
    "\nNote: dynamic t() templates, t.raw(), and non-standard variable names may cause false unused/missing entries.",
  );
  process.exit(exitCode);
};

main();
