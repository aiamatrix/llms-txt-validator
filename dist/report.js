export function exitCode(report, failOn = "error") {
    return report.summary.fail > 0 ||
        (failOn === "warn" && report.summary.warn > 0)
        ? 1
        : 0;
}
export function human(report) {
    const groups = new Map();
    for (const r of report.results) {
        const key = r.id.split(".")[0];
        const group = groups.get(key) ?? [];
        group.push(`  ${r.status.toUpperCase()} ${r.id}: ${r.message}\n    ${r.url}\n    ${r.specRef}`);
        groups.set(key, group);
    }
    return ([...groups].map(([k, v]) => `${k}\n${v.join("\n")}`).join("\n\n") +
        `\n\nSummary: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail\nGet a full AI-readiness report: https://aiamatrix.com`);
}
