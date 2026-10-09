import { it, expect, vi, afterEach } from "vitest";
import { scopedCandidates, applicable } from "../src/scope.js";
import { validate } from "../src/validator.js";
afterEach(() => vi.unstubAllGlobals());
it("uses directory boundaries and most-specific scope", () => {
  expect(
    applicable("https://example.com/docs/a.md", [
      "https://example.com/llms.txt",
      "https://example.com/docs/llms.txt",
    ]),
  ).toBe("https://example.com/docs/llms.txt");
  expect(
    applicable("https://example.com/docs-other/a.md", [
      "https://example.com/docs/llms.txt",
    ]),
  ).toBeUndefined();
  expect(scopedCandidates("https://example.com/docs/a.md")).toEqual([
    "https://example.com/docs/llms.txt",
    "https://example.com/llms.txt",
  ]);
});
it("validates scoped indexes and reports incorrect discovery", async () => {
  const bodies: Record<string, string> = {
    "/llms.txt": "# Site\n\n## Docs\n- [A](https://example.com/docs/a.md)",
    "/docs/llms.txt":
      "# Docs\n\n## Pages\n- [A](https://example.com/docs/a.md)",
    "/docs/a.md": "# A",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: { method: string }) => {
      const p = new URL(input).pathname;
      return new Response(
        init.method === "HEAD" ? null : (bodies[p] ?? "missing"),
        {
          status: bodies[p] ? 200 : 404,
          headers: {
            "content-type": "text/plain",
            link: '</llms.txt>; rel="describedby"',
          },
        },
      );
    }),
  );
  const report = await validate("https://example.com");
  expect(
    report.results.some(
      (r) => r.id === "format.h1" && r.url.endsWith("/docs/llms.txt"),
    ),
  ).toBe(true);
  expect(
    report.results.some(
      (r) =>
        r.id === "discovery.describedby" &&
        r.status === "warn" &&
        r.url.endsWith("a.md"),
    ),
  ).toBe(true);
});
