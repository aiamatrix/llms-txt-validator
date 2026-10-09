import { it, expect } from "vitest";
import { relations, hasRel } from "../src/discovery.js";
it("parses both header and HTML relations", () => {
  const r = relations(
    '<head><link type="text/markdown" href="/page.md" rel="alternate"></head>',
    '</llms.txt>; rel="describedby"',
    "https://example.com/page",
  );
  expect(
    r.some(
      (x) => hasRel(x, "alternate") && x.href === "https://example.com/page.md",
    ),
  ).toBe(true);
  expect(r.some((x) => hasRel(x, "describedby"))).toBe(true);
});
it("handles commas inside quoted parameters and multi-token rel", () => {
  const r = relations(
    "",
    '</p.md>; title="a,b"; rel="alternate describedby"; type="text/markdown"',
    "https://example.com",
  );
  expect(r).toHaveLength(1);
  expect(hasRel(r[0], "alternate")).toBe(true);
});
it("resolves HTML base and entities", () =>
  expect(
    relations(
      '<base href="/docs/"><link rel="alternate" href="a.md?x=1&amp;y=2">',
      null,
      "https://example.com",
    )[0].href,
  ).toBe("https://example.com/docs/a.md?x=1&y=2"));
