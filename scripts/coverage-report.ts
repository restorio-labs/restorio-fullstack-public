import fs from "node:fs";
import path from "node:path";

type Metric = {
  total: number;
  covered: number;
  pct: number;
};

type FileCoverage = {
  lines: Metric;
  statements: Metric;
  functions: Metric;
  branches: Metric;
};

type CoverageSummary = {
  total: FileCoverage;
  [filePath: string]: FileCoverage;
};

type Row = {
  name: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
};

const COVERAGE_PATH = path.resolve(process.cwd(), process.env.COVERAGE_DIR ?? "coverage", "coverage-summary.json");

function color(pct: number): string {
  if (pct >= 80) return "🟢";
  if (pct >= 60) return "🟡";
  return "🔴";
}

function round(pct: number): number {
  return Math.round(pct * 100) / 100;
}

function avg<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((sum, i) => sum + pick(i), 0) / items.length;
}

function readCoverage(): CoverageSummary {
  if (!fs.existsSync(COVERAGE_PATH)) {
    throw new Error(`Coverage file not found: ${COVERAGE_PATH}`);
  }

  console.log("📄 Using coverage file:", COVERAGE_PATH);

  return JSON.parse(fs.readFileSync(COVERAGE_PATH, "utf8")) as CoverageSummary;
}

function extractGroup(filePath: string): { type: "apps" | "packages"; name: string } | null {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const match = normalizedPath.match(/(?:^|\/)(apps|packages|package)\/([^/]+)\//);
  if (!match) return null;

  return {
    type: match[1] === "apps" ? "apps" : "packages",
    name: match[2],
  };
}

function aggregateByGroup(summary: CoverageSummary): { apps: Row[]; packages: Row[] } {
  const apps = new Map<string, FileCoverage[]>();
  const packages = new Map<string, FileCoverage[]>();

  for (const [filePath, data] of Object.entries(summary)) {
    if (filePath === "total") continue;
    if (data.lines.total === 0) continue; // ignore barrel-only files

    const group = extractGroup(filePath);
    if (!group) continue;

    const target = group.type === "apps" ? apps : packages;
    target.set(group.name, [...(target.get(group.name) ?? []), data]);
  }

  return {
    apps: mapToRows(apps),
    packages: mapToRows(packages),
  };
}

function mapToRows(map: Map<string, FileCoverage[]>): Row[] {
  return [...map.entries()]
    .map(([name, files]) => ({
      name,
      lines: round(avg(files, (f) => f.lines.pct)),
      statements: round(avg(files, (f) => f.statements.pct)),
      functions: round(avg(files, (f) => f.functions.pct)),
      branches: round(avg(files, (f) => f.branches.pct)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderTable(title: string, rows: Row[]): string {
  if (!rows.length) {
    return ``;
  }

  return `
| ${title} | Lines | Statements | Functions | Branches |
|------|-------|------------|-----------|----------|
${rows
  .map(
    (r) =>
      `| ${r.name} | ${color(r.lines)} ${r.lines}% | ${color(r.statements)} ${r.statements}% | ${color(r.functions)} ${
        r.functions
      }% | ${color(r.branches)} ${r.branches}% |`,
  )
  .join("\n")}
`;
}

const coverage = readCoverage();
const { apps, packages } = aggregateByGroup(coverage);

const markdown =
  `## 🧪 Unit Test Coverage${apps.length ? "\n" + renderTable("Apps", apps) : ""}${packages.length ? "\n" + renderTable("Packages", packages) : ""}\n`.trim();

fs.writeFileSync("coverage-summary.md", markdown);

console.log("✅ coverage-summary.md generated");
