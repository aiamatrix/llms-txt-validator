import { appendFile } from "node:fs/promises";
import { validate } from "./validator.js";
import { human, exitCode } from "./report.js";
async function main() {
  const url = process.env.INPUT_URL;
  if (!url) throw Error("url input is required");
  const failOn = process.env["INPUT_FAIL-ON"] ?? "error";
  if (failOn !== "warn" && failOn !== "error")
    throw Error("fail-on must be warn or error");
  const report = await validate(url, {
    failOn,
    maxLinks: Number(process.env["INPUT_MAX-LINKS"] ?? 50),
  });
  console.log(human(report));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const escape = (s: string) =>
      s.replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
      );
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## llms.txt validation\n\n${report.summary.pass} pass · ${report.summary.warn} warn · ${report.summary.fail} fail\n\n<pre>${escape(human(report))}</pre>\n`,
    );
  }
  process.exitCode = exitCode(report, failOn);
}
main().catch((e) => {
  console.error("Tool error:", e);
  process.exitCode = 2;
});
