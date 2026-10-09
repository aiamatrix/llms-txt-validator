import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
it("Action uses bundled Node 24 entry and declared inputs", () => {
  const text = readFileSync("action.yml", "utf8");
  expect(text).toContain("using: node24");
  expect(text).toContain("main: dist/action.cjs");
  for (const input of ["url:", "fail-on:", "max-links:", "timeout:"])
    expect(text).toContain(input);
});

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
it("bundled Action validates and writes a job summary", () => {
  const dir = mkdtempSync(join(tmpdir(), "llms-action-"));
  try {
    const summary = join(dir, "summary.md");
    const r = spawnSync(process.execPath, ["dist/action.cjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        INPUT_URL: "tests/fixtures/good/basic.txt",
        "INPUT_FAIL-ON": "error",
        "INPUT_MAX-LINKS": "50",
        GITHUB_STEP_SUMMARY: summary,
      },
    });
    expect(r.status).toBe(0);
    expect(readFileSync(summary, "utf8")).toContain("llms.txt validation");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("invalid numeric Action inputs exit 2 with clear messages", () => {
  for (const [key, value, message] of [
    ["INPUT_MAX-LINKS", "abc", "max-links must be a nonnegative integer"],
    ["INPUT_MAX-LINKS", "-1", "max-links must be a nonnegative integer"],
    ["INPUT_TIMEOUT", "0", "timeout must be a positive integer"],
    ["INPUT_TIMEOUT", "1.5", "timeout must be a positive integer"],
  ]) {
    const run = spawnSync(process.execPath, ["dist/action.cjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        INPUT_URL: "tests/fixtures/good/basic.txt",
        [key]: value,
      },
    });
    expect(run.status).toBe(2);
    expect(run.stderr).toContain(message);
    expect(run.stderr).not.toContain("at main");
  }
});
