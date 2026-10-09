import { describe, it, expect } from "vitest";
import { checkFormat } from "../src/format.js";
import { readFileSync, readdirSync } from "node:fs";
const format = (s: string) => checkFormat(s, "https://example.com/llms.txt");
describe("v2 format", () => {
  for (const folder of ["good", "edge-cases"])
    for (const file of readdirSync(`tests/fixtures/${folder}`))
      it(`${folder}/${file}`, () =>
        expect(
          format(
            readFileSync(`tests/fixtures/${folder}/${file}`, "utf8"),
          ).results.some((r) => r.status === "fail"),
        ).toBe(false));
  for (const file of readdirSync("tests/fixtures/bad"))
    it(`bad/${file}`, () =>
      expect(
        format(readFileSync(`tests/fixtures/bad/${file}`, "utf8")).results.some(
          (r) => r.status === "fail",
        ),
      ).toBe(true));
  it("size is a warning", () =>
    expect(
      format("# Site\n\n" + "a".repeat(51201)).results.find(
        (r) => r.id === "file.size",
      )?.status,
    ).toBe("warn"));
  it("Optional links are not omitted", () =>
    expect(
      format("# Site\n\n## Optional\n- [Extra](https://example.com/extra.md)")
        .links,
    ).toEqual(["https://example.com/extra.md"]));
});

it("extracts links from all supported Markdown forms", () => {
  for (const name of ["star", "plus", "wrapped", "parentheses", "title"]) {
    const parsed = format(
      readFileSync(`tests/fixtures/good/${name}.txt`, "utf8"),
    );
    expect(
      parsed.results.every((r) => r.status === "pass" || r.status === "info"),
    ).toBe(true);
    expect(parsed.links).toHaveLength(1);
  }
  expect(
    format(readFileSync("tests/fixtures/good/parentheses.txt", "utf8"))
      .links[0],
  ).toBe("https://en.wikipedia.org/wiki/Foo_(bar)");
});
it("warns on section prose and late summaries while preserving links", () => {
  expect(
    format(readFileSync("tests/fixtures/edge-cases/prose-section.txt", "utf8"))
      .results,
  ).toContainEqual(
    expect.objectContaining({ id: "format.section-prose", status: "warn" }),
  );
  expect(
    format(readFileSync("tests/fixtures/edge-cases/late-summary.txt", "utf8"))
      .results,
  ).toContainEqual(
    expect.objectContaining({ id: "format.summary-order", status: "warn" }),
  );
  const parsed = format(
    "# Site\n\n## Pages\nIntro\n\n- Prefix [A](https://e.com/a.md): notes",
  );
  expect(parsed.links).toEqual(["https://e.com/a.md"]);
  expect(parsed.results.some((r) => r.status === "fail")).toBe(false);
});
