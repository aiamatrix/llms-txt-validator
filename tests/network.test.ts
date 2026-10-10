import { it, expect, vi, afterEach } from "vitest";
import { validate } from "../src/validator.js";
import { Client, pooled } from "../src/network.js";
afterEach(() => vi.unstubAllGlobals());
it("HEAD falls back to GET", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 405 }))
    .mockResolvedValueOnce(new Response("ok"));
  vi.stubGlobal("fetch", fetch);
  expect((await new Client(100).resolve("https://example.com/a")).status).toBe(
    200,
  );
  expect(fetch.mock.calls[1][1].method).toBe("GET");
  expect(fetch.mock.calls[0][1].headers["User-Agent"]).toContain(
    "aiamatrix-llms-txt-validator/1.0.0",
  );
});
it("redirect loop is bounded", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(null, { status: 302, headers: { location: "/a" } }),
    ),
  );
  await expect(
    new Client(100).request("https://example.com/a"),
  ).rejects.toThrow("Redirect loop");
});
it("redirects resolve relative locations", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: "/b" } }),
      )
      .mockResolvedValueOnce(new Response("ok")),
  );
  expect((await new Client(100).request("https://example.com/a")).url).toBe(
    "https://example.com/b",
  );
});
it("pool never exceeds five tasks", async () => {
  let active = 0,
    peak = 0;
  await pooled(
    Array.from({ length: 20 }, (_, i) => i),
    async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 1));
      active--;
    },
  );
  expect(peak).toBe(5);
});
it("rejects non-HTTP redirect", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "file:///tmp/a" },
        }),
    ),
  );
  await expect(
    new Client(100).request("https://example.com/a"),
  ).rejects.toThrow("HTTP(S)");
});
it("aborts requests when timeout expires", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener("abort", () =>
            reject(Error("Aborted")),
          ),
        ),
    ),
  );
  await expect(new Client(5).request("https://example.com/a")).rejects.toThrow(
    "timed out after 5 ms",
  );
});
it("caps response bytes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("a".repeat(2 * 1024 * 1024 + 1))),
  );
  await expect(
    new Client(100).request("https://example.com/a"),
  ).rejects.toThrow("2 MiB");
});

it("preserves underlying network error codes without stacks", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(
      new TypeError("fetch failed", {
        cause: Object.assign(new Error("example.invalid"), {
          code: "ENOTFOUND",
        }),
      }),
    ),
  );
  await expect(
    new Client(100).request("https://example.invalid/a"),
  ).rejects.toThrow("fetch failed: ENOTFOUND example.invalid");
});
it("validation reports underlying fetch errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(
      new TypeError("fetch failed", {
        cause: Object.assign(new Error("example.invalid"), {
          code: "ENOTFOUND",
        }),
      }),
    ),
  );
  const report = await validate("https://example.invalid");
  expect(report.results.find((r) => r.id === "file.fetch")?.message).toBe(
    "fetch failed: ENOTFOUND example.invalid",
  );
});
