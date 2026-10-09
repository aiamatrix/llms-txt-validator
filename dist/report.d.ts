import type { Report } from "./types.js";
export declare function exitCode(report: Report, failOn?: "warn" | "error"): 0 | 1;
export declare function human(report: Report): string;
