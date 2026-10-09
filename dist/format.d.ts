import type { Result } from "./types.js";
export interface Parsed {
    results: Result[];
    links: string[];
}
export declare function checkFormat(input: string, url: string): Parsed;
