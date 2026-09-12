/// <reference types="bun" />

import { $ } from "bun";
import { resolve } from "path";
import { existsSync, rmSync, readdirSync, statSync } from "fs";

const rootDir = process.cwd();

const directoryPatterns = [
  "dist",
  ".next",
  "out",
  "build",
  ".turbo",
  "coverage",
  "test-results",
  "playwright-report",
  ".cache",
];

const filePatterns = ["*.tsbuildinfo"];

const removeDirectory = (path: string): boolean => {
  try {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`⚠️  Error removing ${path}:`, error);
    return false;
  }
};

const findDirectories = (dir: string, pattern: string, results: string[] = []): string[] => {
  try {
    if (!existsSync(dir)) {
      return results;
    }

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = resolve(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (entry === pattern) {
            results.push(fullPath);
          }
          if (entry !== "node_modules" && entry !== ".git") {
            findDirectories(fullPath, pattern, results);
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    return results;
  }
  return results;
};

const removeFiles = async (pattern: string): Promise<void> => {
  try {
    await $`find . -name "${pattern}" -type f -not -path "./node_modules/*" -not -path "./.git/*" -delete`.quiet();
  } catch (error) {
    console.error(`⚠️  Error removing files matching ${pattern}:`, error);
  }
};

console.log("🧹 Cleaning build artifacts and temporary files...\n");

let removedCount = 0;

for (const pattern of directoryPatterns) {
  const rootPath = resolve(rootDir, pattern);
  if (removeDirectory(rootPath)) {
    console.log(`✅ Removed: ${pattern}`);
    removedCount++;
  }

  const foundDirs = findDirectories(rootDir, pattern).filter((p) => !p.includes("node_modules") && !p.includes(".git"));

  for (const dir of foundDirs) {
    if (removeDirectory(dir)) {
      const relativePath = dir.replace(rootDir + "/", "");
      console.log(`✅ Removed: ${relativePath}`);
      removedCount++;
    }
  }
}

const nodeModulesCache = resolve(rootDir, "node_modules/.cache");
if (removeDirectory(nodeModulesCache)) {
  console.log(`✅ Removed: node_modules/.cache`);
  removedCount++;
}

const playwrightCache = resolve(rootDir, "playwright/.cache");
if (removeDirectory(playwrightCache)) {
  console.log(`✅ Removed: playwright/.cache`);
  removedCount++;
}

console.log("\n🗑️  Removing TypeScript build info files...");

for (const pattern of filePatterns) {
  await removeFiles(pattern);
  console.log(`✅ Cleaned files matching: ${pattern}`);
}

console.log(`\n✨ Clean complete! Removed ${removedCount} directories and cleaned build artifacts.`);

process.exit(0);
