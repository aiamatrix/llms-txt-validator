import { it, expect, vi, afterEach } from "vitest";
import { validate } from "../src/validator.js";
import { exitCode, human } from "../src/report.js";
afterEach(() => vi.unstubAllGlobals());
it("local mode performs no HTTP and emits stable fields", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const r = await validate("tests/fixtures/good/basic.txt");
  expect(fetch).not.toHaveBeenCalled();
  expect(Object.keys(r)).toEqual([
    "version",
    "url",
    "checkedAt",
    "summary",
    "results",
  ]);
  expect(exitCode(r)).toBe(0);
  expect(human(r).split("\n").at(-1)).toBe(
    "Get a full AI-readiness report: https://aiamatrix.com",
  );
  expect(JSON.stringify(r)).not.toContain("Get a full");
});
it("invalid file fails, invalid options throw", async () => {
  expect(exitCode(await validate("tests/fixtures/bad/empty.txt"))).toBe(1);
  await expect(validate("a", { maxLinks: -1 })).rejects.toThrow();
  await expect(
    validate("https://example.com", { network: false }),
  ).rejects.toThrow("local file");
});
it("warn threshold changes exit policy", async () => {
  const r = await validate("tests/fixtures/good/basic.txt");
  r.summary.warn = 1;
  expect(exitCode(r)).toBe(0);
  expect(exitCode(r, "warn")).toBe(1);
});
it("HTML error pages fail, even with HTTP 200", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response("<!doctype html><html>Error</html>", {
          headers: { "content-type": "text/html" },
        }),
    ),
  );
  const r = await validate("https://example.com");
  expect(r.results.find((x) => x.id === "file.not-html")?.status).toBe("fail");
});
it("max-links zero reports incomplete coverage", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response("# Site\n\n## Docs\n- [A](https://example.com/a.md)", {
          headers: { "content-type": "text/plain" },
        }),
    ),
  );
  const r = await validate("https://example.com", { maxLinks: 0 });
  expect(r.results.find((x) => x.id === "links.limit")?.status).toBe("warn");
});

import { spawnSync } from "node:child_process";
it("actual CLI exits cleanly and JSON has no trailing human text", () => {
  const run = spawnSync(
    process.execPath,
    ["dist/cli.js", "tests/fixtures/good/basic.txt", "--json"],
    { encoding: "utf8" },
  );
  expect(run.status).toBe(0);
  expect(JSON.parse(run.stdout).version).toBe("1.0");
  expect(run.stdout).not.toContain("Get a full");
});
it("actual CLI returns 1 for format failures and 2 for tool errors", () => {
  expect(
    spawnSync(process.execPath, ["dist/cli.js", "tests/fixtures/bad/empty.txt"])
      .status,
  ).toBe(1);
  const run = spawnSync(
    process.execPath,
    ["dist/cli.js", "--json", "--unknown"],
    { encoding: "utf8" },
  );
  expect(run.status).toBe(2);
  expect(JSON.parse(run.stdout).error.message).toBeTruthy();
});
