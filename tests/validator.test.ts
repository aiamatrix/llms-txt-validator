import { it, expect } from "vitest";
import { createServer, type Server, type RequestListener } from "node:http";
import { type AddressInfo } from "node:net";
import { validate } from "../src/validator.js";
async function listen(
  handler: RequestListener,
): Promise<{ server: Server; origin: string }> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    server,
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
  };
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve())),
  );
}
it("external links receive only HTTP and resource-type checks", async () => {
  const requests: string[] = [];
  const b = await listen((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    res.setHeader("content-type", "text/markdown");
    res.end("# External");
  });
  const a = await listen((_req, res) => {
    res.setHeader("content-type", "text/plain");
    res.end(`# Site\n\n## Pages\n- [External](${b.origin}/external.md)`);
  });
  try {
    const report = await validate(a.origin);
    expect(requests).toEqual(["HEAD /external.md", "GET /external.md"]);
    expect(
      report.results
        .filter((r) => r.url.startsWith(b.origin))
        .map((r) => r.id)
        .sort(),
    ).toEqual(["links.http", "links.resource-type"]);
  } finally {
    await close(a.server);
    await close(b.server);
  }
});

it("checks each HTML and Markdown resource once without duplicate results", async () => {
  let origin = "";
  const site = await listen((req, res) => {
    const path = req.url ?? "";
    if (path === "/llms.txt") {
      res.setHeader("content-type", "text/plain");
      res.end(
        `# Site\n\n## Pages\n- [Pricing](${origin}/pricing.md)\n- [About](${origin}/about.md)`,
      );
    } else if (["/pricing.md", "/about.md"].includes(path)) {
      res.setHeader("content-type", "text/markdown");
      res.setHeader("link", '</llms.txt>; rel="describedby"');
      res.end("# Page");
    } else if (["/pricing", "/about"].includes(path)) {
      res.setHeader("content-type", "text/html");
      res.end(
        `<html><head><link rel="alternate" type="text/markdown" href="${path}.md"><link rel="describedby" href="/llms.txt"></head><body>Page</body></html>`,
      );
    } else {
      res.statusCode = 404;
      res.end("Missing");
    }
  });
  origin = site.origin;
  try {
    const report = await validate(origin);
    const keys = report.results.map((r) => `${r.id} ${r.url}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(
      report.results.filter((r) => r.id === "discovery.describedby"),
    ).toHaveLength(4);
    expect(
      report.summary.pass +
        report.summary.info +
        report.summary.warn +
        report.summary.fail,
    ).toBe(report.results.length);
  } finally {
    await close(site.server);
  }
});
