import MarkdownIt from "markdown-it";
import { SPEC } from "./spec.js";
const parser = new MarkdownIt();
export function checkFormat(input, url) {
    const text = input.replace(/^\uFEFF/, "");
    const results = [];
    const links = [];
    const add = (id, ok, message) => results.push({
        id,
        status: ok ? "pass" : "fail",
        message,
        specRef: SPEC.format,
        url,
    });
    const tokens = parser.parse(text, {});
    const heads = tokens.filter((t) => t.type === "heading_open");
    add("format.h1", heads.filter((t) => t.tag === "h1").length === 1 &&
        tokens[0]?.type === "heading_open" &&
        tokens[0]?.tag === "h1" &&
        !!tokens[1]?.content.trim(), "File must begin with exactly one nonempty H1.");
    add("format.heading-levels", heads.every((t) => t.tag === "h1" || t.tag === "h2"), "Only H1 and H2 headings are allowed.");
    let section = false;
    let count = 0;
    let sectionNumber = 0;
    let sectionBad = false;
    let preambleStarted = false;
    let summarySeen = false;
    const close = () => {
        if (section) {
            add(`format.section.${sectionNumber}`, count > 0 && !sectionBad, "Each H2 section must contain only nonempty link-list items.");
        }
    };
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.level !== 0)
            continue;
        if (t.type === "heading_open") {
            if (t.tag === "h2") {
                close();
                section = true;
                count = 0;
                sectionBad = !tokens[i + 1]?.content.trim();
                sectionNumber++;
            }
            else if (i > 0) {
                if (section)
                    sectionBad = true;
            }
            i += 2;
            continue;
        }
        if (!section) {
            if (t.type === "blockquote_open") {
                add("format.summary-order", !preambleStarted && !summarySeen, "An optional summary must precede the non-heading preamble.");
                summarySeen = true;
            }
            else if (t.type.endsWith("_open") ||
                t.type === "fence" ||
                t.type === "html_block")
                preambleStarted = true;
            continue;
        }
        if (t.type === "bullet_list_open") {
            const end = tokens.findIndex((x, j) => j > i && x.type === "bullet_list_close" && x.level === 0);
            const items = tokens.slice(i + 1, end);
            for (const item of items.filter((x) => x.type === "list_item_open")) {
                const a = item.map?.[0] ?? 0;
                const b = item.map?.[1] ?? a + 1;
                const raw = text.split("\n").slice(a, b).join("\n").trimEnd();
                const match = /^- \[([^\]\n]+)\]\(([^\s)]+)\)(?:\s*:\s*([^\n]+))?\s*$/.exec(raw);
                if (!match)
                    sectionBad = true;
                else {
                    count++;
                    links.push(match[2]);
                }
            }
            if (items.some((x) => x.type === "bullet_list_open" || x.type === "ordered_list_open"))
                sectionBad = true;
            i = end;
            continue;
        }
        if (!t.type.endsWith("_close"))
            sectionBad = true;
    }
    close();
    results.push({
        id: "file.size",
        status: Buffer.byteLength(input) > 50 * 1024 ? "warn" : "pass",
        message: "Keep llms.txt at or below 50 KiB (tool guidance, not a spec requirement).",
        specRef: SPEC.proposal,
        url,
    });
    return { results, links };
}
