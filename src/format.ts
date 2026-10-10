import MarkdownIt from "markdown-it";
import type { Result } from "./types.js";
import { SPEC } from "./spec.js";
const parser = new MarkdownIt();
export interface Parsed {
  results: Result[];
  links: string[];
}
export function checkFormat(input: string, url: string): Parsed {
  const text = input.replace(/^\uFEFF/, "");
  const results: Result[] = [];
  const links: string[] = [];
  const add = (id: string, ok: boolean, message: string) =>
    results.push({
      id,
      status: ok ? "pass" : "fail",
      message,
      specRef: SPEC.format,
      url,
    });
  const tokens = parser.parse(text, {});
  const heads = tokens.filter((t) => t.type === "heading_open");
  add(
    "format.h1",
    heads.filter((t) => t.tag === "h1").length === 1 &&
      tokens[0]?.type === "heading_open" &&
      tokens[0]?.tag === "h1" &&
      !!tokens[1]?.content.trim(),
    "File must begin with exactly one nonempty H1.",
  );
  add(
    "format.heading-levels",
    heads.every((t) => t.tag === "h1" || t.tag === "h2"),
    "Only H1 and H2 headings are allowed.",
  );
  let section = false;
  let count = 0;
  let sectionNumber = 0;
  let sectionBad = false;
  let preambleStarted = false;
  let summarySeen = false;
  const warn = (id: string, message: string) =>
    results.push({ id, status: "warn", message, specRef: SPEC.format, url });
  const close = () => {
    if (section)
      add(
        `format.section.${sectionNumber}`,
        count > 0 && !sectionBad,
        "Each H2 section must contain nonempty link-list items.",
      );
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.level !== 0) continue;
    if (t.type === "heading_open") {
      if (t.tag === "h2") {
        close();
        section = true;
        count = 0;
        sectionBad = !tokens[i + 1]?.content.trim();
        sectionNumber++;
      }
      i += 2;
      continue;
    }
    if (!section) {
      if (t.type === "blockquote_open") {
        if (preambleStarted || summarySeen)
          warn(
            "format.summary-order",
            "An optional summary should precede the non-heading preamble.",
          );
        else
          add(
            "format.summary-order",
            true,
            "Summary precedes the non-heading preamble.",
          );
        summarySeen = true;
      } else if (
        t.type.endsWith("_open") ||
        t.type === "fence" ||
        t.type === "html_block"
      )
        preambleStarted = true;
      continue;
    }
    if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
      const end = tokens.findIndex(
        (x, j) =>
          j > i &&
          x.type === t.type.replace("_open", "_close") &&
          x.level === 0,
      );
      for (let j = i + 1; j < end; j++) {
        if (tokens[j].type !== "list_item_open") continue;
        count++;
        const level = tokens[j].level;
        const itemEnd = tokens.findIndex(
          (x, k) => k > j && x.type === "list_item_close" && x.level === level,
        );
        const inlines = tokens
          .slice(j + 1, itemEnd)
          .filter((x) => x.type === "inline");
        const children = inlines.flatMap((x) => x.children ?? []);
        const firstLink = children.find((x) => x.type === "link_open");
        // Preserve links even when the item's arrangement needs a warning.
        for (const child of children.filter((x) => x.type === "link_open")) {
          const href = child.attrGet("href");
          if (href) links.push(href);
        }
        if (!firstLink) sectionBad = true;
        else if (children[0]?.type !== "link_open")
          warn(
            "format.item-prefix",
            "A file-list item should start with its link.",
          );
        else {
          const linkEnd = children.findIndex((x) => x.type === "link_close");
          const suffix = children
            .slice(linkEnd + 1)
            .map((x) => x.content)
            .join("")
            .trim();
          if (suffix && !suffix.startsWith(":"))
            warn(
              "format.item-notes",
              "Notes after a file-list link should start with a colon.",
            );
        }
      }
      i = end;
      continue;
    }
    if (!t.type.endsWith("_close"))
      warn(
        "format.section-prose",
        "H2 sections should contain file lists; additional prose is present.",
      );
  }
  close();
  const bytes = Buffer.byteLength(input);
  const size =
    bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KiB` : `${bytes} B`;
  results.push({
    id: "file.size",
    status: bytes > 50 * 1024 ? "warn" : "info",
    message:
      bytes > 50 * 1024
        ? `llms.txt is ${size}, above the 50 KiB guidance; agents may truncate or skip it (not a spec requirement).`
        : `llms.txt is ${size} (guidance: 50 KiB or less; not a spec requirement).`,
    specRef: SPEC.proposal,
    url,
  });
  return { results, links };
}
