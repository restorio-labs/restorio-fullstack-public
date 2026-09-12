import fs from "node:fs";
import path from "node:path";

type Metric = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

type FileCoverage = {
  lines: Metric;
  statements: Metric;
  functions: Metric;
  branches: Metric;
  branchesTrue?: Metric;
};

type CoverageSummary = {
  total: FileCoverage;
  [filePath: string]: FileCoverage | FileCoverage["lines"] | undefined;
};

function recomputeTotal(files: Record<string, FileCoverage>): FileCoverage {
  const keys = ["lines", "statements", "functions", "branches"] as const;
  const out: Record<string, Metric> = {};

  for (const k of keys) {
    let total = 0;
    let covered = 0;
    let skipped = 0;
    for (const fc of Object.values(files)) {
      const m = fc[k];
      total += m.total;
      covered += m.covered;
      skipped += m.skipped;
    }
    const pct = total > 0 ? (covered / total) * 100 : 100;
    out[k] = {
      total,
      covered,
      skipped,
      pct: Math.round(pct * 100) / 100,
    };
  }

  return {
    lines: out.lines!,
    statements: out.statements!,
    functions: out.functions!,
    branches: out.branches!,
    branchesTrue: { total: 0, covered: 0, skipped: 0, pct: 100 },
  };
}

function pickBetter(a: FileCoverage, b: FileCoverage): FileCoverage {
  if (a.lines.total === 0) return b;
  if (b.lines.total === 0) return a;
  return a.lines.covered / a.lines.total >= b.lines.covered / b.lines.total ? a : b;
}

function mergeSummaries(inputs: CoverageSummary[]): CoverageSummary {
  const mergedFiles: Record<string, FileCoverage> = {};

  for (const summary of inputs) {
    for (const [filePath, data] of Object.entries(summary)) {
      if (filePath === "total") continue;
      const fc = data as FileCoverage;
      if (!fc.lines) continue;
      const existing = mergedFiles[filePath];
      mergedFiles[filePath] = existing ? pickBetter(existing, fc) : fc;
    }
  }

  return {
    total: recomputeTotal(mergedFiles),
    ...mergedFiles,
  };
}

function readSummary(filePath: string): CoverageSummary {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CoverageSummary;
}

function main(): void {
  const outPath = process.argv[2];
  const inputPaths = process.argv.slice(3).filter((p) => p.length > 0);

  if (!outPath) {
    console.error("Usage: merge-coverage-summaries.ts <output.json> <input.json> [...]");
    process.exit(1);
  }

  const existing = inputPaths.filter((p) => fs.existsSync(p));
  if (existing.length === 0) {
    console.error("No coverage summary files found to merge.");
    process.exit(1);
  }

  const summaries = existing.map(readSummary);
  const merged = mergeSummaries(summaries);

  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(merged), "utf8");
  console.log("✅ Merged", existing.length, "summaries →", outPath);
}

main();
