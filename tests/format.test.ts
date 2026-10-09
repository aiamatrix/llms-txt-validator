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
