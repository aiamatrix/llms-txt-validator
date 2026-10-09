#!/usr/bin/env node
import { parseArgs } from "node:util";
import { validate } from "./validator.js";
import { human, exitCode } from "./report.js";
import { VERSION } from "./spec.js";
let json = process.argv.slice(2).includes("--json");
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      "max-links": { type: "string" },
      timeout: { type: "string" },
      "fail-on": { type: "string" },
      "no-network": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
  json = values.json ?? false;
  if (values.help) {
    console.log(
      "Usage: llms-txt-validator <url|file> [--json] [--max-links 50] [--timeout 10000] [--fail-on warn|error] [--no-network]",
    );
  } else if (values.version) {
    console.log(VERSION);
  } else {
    if (positionals.length !== 1)
      throw Error("Provide exactly one website URL or local llms.txt file");
    const failOn = values["fail-on"] ?? "error";
    if (failOn !== "warn" && failOn !== "error")
      throw Error("--fail-on must be warn or error");
    const report = await validate(positionals[0], {
      maxLinks:
        values["max-links"] === undefined ? 50 : Number(values["max-links"]),
      timeout: values.timeout === undefined ? 10000 : Number(values.timeout),
      failOn,
      network: !values["no-network"],
    });
    console.log(json ? JSON.stringify(report, null, 2) : human(report));
    process.exitCode = exitCode(report, failOn);
  }
} catch (e) {
  if (json)
    console.log(
      JSON.stringify({
        version: "1.0",
        error: { message: e instanceof Error ? e.message : String(e) },
      }),
    );
  else
    console.error(`Tool error: ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 2;
}
