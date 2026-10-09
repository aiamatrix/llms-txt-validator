import { appendFile } from "node:fs/promises";
import { validate } from "./validator.js";
import { human, exitCode } from "./report.js";
async function main() {
    const url = process.env.INPUT_URL;
    if (!url)
        throw Error("url input is required");
    const failOn = process.env["INPUT_FAIL-ON"] ?? "error";
    if (failOn !== "warn" && failOn !== "error")
        throw Error("fail-on must be warn or error");
    const numeric = (name, fallback, minimum) => {
        const raw = process.env[`INPUT_${name.toUpperCase()}`] ?? fallback;
        const value = Number(raw);
        if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < minimum)
            throw Error(`${name} must be ${minimum === 0 ? "a nonnegative" : "a positive"} integer`);
        return value;
    };
    const maxLinks = numeric("max-links", "50", 0);
    const timeout = numeric("timeout", "10000", 1);
    const report = await validate(url, {
        failOn,
        maxLinks,
        timeout,
    });
    console.log(human(report));
    if (process.env.GITHUB_STEP_SUMMARY) {
        const escape = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
        await appendFile(process.env.GITHUB_STEP_SUMMARY, `## llms.txt validation\n\n${report.summary.pass} pass · ${report.summary.warn} warn · ${report.summary.fail} fail\n\n<pre>${escape(human(report))}</pre>\n`);
    }
    process.exitCode = exitCode(report, failOn);
}
main().catch((e) => {
    console.error(`Tool error: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 2;
});
