#!/usr/bin/env python3
import json
import os
from pathlib import Path
from typing import Any

COVERAGE_DIR = os.getenv("COVERAGE_DIR", "coverage")
COVERAGE_PATH = Path(COVERAGE_DIR) / "coverage.json"


def color(pct: float) -> str:
    if pct >= 80:
        return "🟢"
    if pct >= 60:
        return "🟡"
    return "🔴"


def round_pct(pct: float) -> float:
    return round(pct * 100) / 100


def read_coverage() -> dict[str, Any]:
    if not COVERAGE_PATH.exists():
        raise FileNotFoundError(f"Coverage file not found: {COVERAGE_PATH}")

    print(f"📄 Using coverage file: {COVERAGE_PATH}")

    with open(COVERAGE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_module_name(file_path: str) -> str | None:
    normalized = file_path.replace("\\", "/")
    if "/tests/" in normalized or normalized.startswith("tests/"):
        return None
    if normalized.endswith(".py") is False:
        return None

    if "app/api/" in normalized:
        rest = normalized.split("app/api/", 1)[1]
    else:
        rest = normalized.lstrip("/")

    parts = [p for p in rest.split("/") if p]
    if not parts:
        return None

    top = parts[0]
    if top == "main.py":
        return "main"
    if top == "alembic":
        return "alembic"
    if top == "__pycache__":
        return None
    if top == "core":
        if len(parts) < 2:
            return "core"
        sub = parts[1]
        if sub == "__init__.py" or sub.endswith(".py"):
            return "core"
        return sub
    if top == "services":
        return "services"
    if top == "routes":
        if len(parts) >= 2 and parts[1] == "__init__.py":
            return "routes"
        if len(parts) >= 2:
            return f"routes/{parts[1]}"
        return "routes"
    if top in ("api", "modules"):
        if len(parts) >= 2:
            return f"{top}/{parts[1]}"
        return top
    return top


def aggregate_by_module(
    coverage_data: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    modules: dict[str, list[dict[str, Any]]] = {}

    files = coverage_data.get("files", {})

    for file_path, file_data in files.items():
        if file_path == "__init__.py":
            continue

        module = extract_module_name(file_path)
        if not module:
            continue

        summary = file_data.get("summary", {})
        if summary.get("num_statements", 0) == 0:
            continue

        if module not in modules:
            modules[module] = []

        modules[module].append(summary)

    return modules


def calculate_metrics(summaries: list[dict[str, Any]]) -> dict[str, float]:
    if not summaries:
        return {"lines": 0.0, "statements": 0.0}

    total_lines = 0
    covered_lines = 0
    total_st = 0
    covered_st = 0.0

    for s in summaries:
        cl = int(s.get("covered_lines", 0))
        ml = int(s.get("missing_lines", 0))
        line_total = cl + ml
        if line_total > 0:
            total_lines += line_total
            covered_lines += cl

        nst = int(s.get("num_statements", 0))
        if nst > 0:
            total_st += nst
            pct = float(s.get("percent_statements_covered", s.get("percent_covered", 0)))
            covered_st += nst * pct / 100.0

    lines_pct = (covered_lines / total_lines * 100.0) if total_lines else 0.0
    statements_pct = (covered_st / total_st * 100.0) if total_st else 0.0

    return {
        "lines": round_pct(lines_pct),
        "statements": round_pct(statements_pct),
    }


def render_table(title: str, rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""

    table = f"\n| {title} | Lines | Statements |\n"
    table += "|------|-------|------------|\n"

    for row in rows:
        table += (
            f"| {row['name']} | {color(row['lines'])} {row['lines']}% | "
            f"{color(row['statements'])} {row['statements']}% |\n"
        )

    return table


def main() -> None:
    coverage = read_coverage()
    modules_data = aggregate_by_module(coverage)

    rows = []
    for module_name, summaries in sorted(modules_data.items()):
        metrics = calculate_metrics(summaries)
        rows.append(
            {
                "name": module_name,
                "lines": metrics["lines"],
                "statements": metrics["statements"],
            }
        )

    markdown = f"## 🧪 API Unit Test Coverage{render_table('API Modules', rows)}\n".strip()

    output_path = Path("coverage-summary.md")
    output_path.write_text(markdown, encoding="utf-8")

    print("✅ coverage-summary.md generated")


if __name__ == "__main__":
    main()
