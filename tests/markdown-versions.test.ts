import { it, expect } from "vitest";
import {
  markdownCandidates,
  pageCandidates,
} from "../src/markdown-versions.js";
it("accepts appended and replaced extensions", () =>
  expect(markdownCandidates("https://example.com/page.html")).toEqual([
    "https://example.com/page.html.md",
    "https://example.com/page.md",
  ]));
it("directory forms and counterparts", () => {
  expect(markdownCandidates("https://example.com/docs/")).toEqual([
    "https://example.com/docs/index.md",
    "https://example.com/docs/index.html.md",
  ]);
  expect(pageCandidates("https://example.com/docs/index.md")).toContain(
    "https://example.com/docs/",
  );
});
