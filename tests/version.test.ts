import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { VERSION } from "../src/spec.js";
it("uses the package version in source, CLI and Action bundle", () => {
  const { version } = JSON.parse(readFileSync("package.json", "utf8"));
  expect(VERSION).toBe(version);
  expect(
    spawnSync(process.execPath, ["dist/cli.js", "--version"], {
      encoding: "utf8",
    }).stdout.trim(),
  ).toBe(version);
  expect(readFileSync("dist/action.cjs", "utf8")).toContain(
    `var VERSION = "${version}"`,
  );
});
