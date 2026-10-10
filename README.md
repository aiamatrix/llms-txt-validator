# llms.txt Validator

A standalone CLI, Node.js library, and GitHub Action for checking the [llms.txt v2 proposal](https://llmstxt.org/) and its [August 2026 changes](https://llmstxt.org/changes.html).

<!-- Badges: enable CI, npm version, and license badges after publishing. -->

## Example output

Excerpt from `node dist/cli.js tests/fixtures/good/basic.txt`, with resource URLs and specification references omitted.

```text
  INFO file.size: llms.txt is 113 B (guidance: 50 KiB or less; not a spec requirement).
  PASS format.h1: File must begin with exactly one nonempty H1.
  PASS format.heading-levels: Only H1 and H2 headings are allowed.
  PASS format.section.1: Each H2 section must contain nonempty link-list items.
  PASS format.summary-order: Summary precedes the non-heading preamble.
  INFO network.skipped: Format-only mode: network, discovery and scope checks were not performed.

Summary: 4 pass, 2 info, 0 warn, 0 fail
Get a full AI-readiness report: https://aiamatrix.com
```

Maintained by Polygons Media LLC, San Rafael, California. Contact: contact@aiamatrix.com. Product website: https://aiamatrix.com.

This tool checks file structure and selected publication signals. It does not measure the AIA Score or guarantee AI citations, rankings, retrieval, or traffic. No telemetry is collected. Remote validation sends requests only to the submitted site and linked resources, with Markdown/HTML counterpart and applicable llms.txt probes limited to the root index’s origin.

## Install and run

Requires Node.js 22 or newer. The following npm and Action examples become available after publication.

```sh
npx @aiamatrix/llms-txt-validator https://example.com
npx @aiamatrix/llms-txt-validator ./public/llms.txt
npx @aiamatrix/llms-txt-validator ./public/llms.txt --no-network --json
```

From source (use Node.js 22.13+ for development; Node 24 is recommended):

```sh
npm ci
npm run build
node dist/cli.js https://example.com
```

| Option                  | Default | Meaning                                                                                 |
| ----------------------- | ------- | --------------------------------------------------------------------------------------- |
| `--json`                | off     | JSON only, without the product-report line                                              |
| `--max-links <n>`       | 50      | Maximum unique llms.txt link targets across all discovered indexes; nonnegative integer |
| `--timeout <ms>`        | 10000   | Timeout for each request, including its redirects and response body                     |
| `--fail-on error\|warn` | error   | Make failures, or failures and warnings, exit with code 1                               |
| `--no-network`          | off     | Format-only local validation; a remote URL with this flag is a tool error               |
| `--help`                | off     | Show usage                                                                              |
| `--version`             | off     | Show package version                                                                    |

Local files always receive format-only validation. Their linked files, discovery relations, and scopes are not checked, regardless of the flag. A `network.skipped` result identifies this limitation. Website URLs use `/llms.txt`; a path such as `https://example.com/docs/` uses `/docs/llms.txt`.

Exit codes: **0** means no findings at the configured failure threshold; **1** means validation findings reached that threshold; **2** means a tool error such as invalid arguments or an unreadable local file. A remote resource failure is a validation failure, not a tool error. Warnings may exist with exit code 0. Informational results never affect exit codes.

## What it checks

| Check                                                                                                                                 | Failure or warning                                                             | Reference                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| HTTP 200, plain/Markdown content type, non-HTML body                                                                                  | Failure                                                                        | [Proposal](https://llmstxt.org/#proposal)                  |
| Exactly one initial H1; only H1/H2 headings                                                                                           | Failure                                                                        | [Format](https://llmstxt.org/#format)                      |
| Optional summary before non-heading preamble                                                                                          | Warning                                                                        | [Format](https://llmstxt.org/#format)                      |
| H2 sections contain nonempty Markdown link lists; all bullet markers, titles, balanced URL parentheses and wrapped notes are accepted | Empty sections or items without links fail; prose or item arrangement warns    | [Format](https://llmstxt.org/#format)                      |
| Linked resources return 200, HEAD with GET fallback                                                                                   | Failure                                                                        | [Proposal](https://llmstxt.org/#proposal)                  |
| Linked resource is HTML or lacks a plain/Markdown type                                                                                | Warning                                                                        | [Proposal](https://llmstxt.org/#proposal)                  |
| Same-page Markdown version exists, appended or replaced `.md`, directory `index.md` or `index.html.md`                                | Warning                                                                        | [Proposal](https://llmstxt.org/#proposal)                  |
| HTML alternate and describedby relations; Markdown describedby relation                                                               | Warning                                                                        | [Proposal](https://llmstxt.org/#proposal)                  |
| Scoped indexes and most-specific applicable describedby relation                                                                      | Invalid existing index fails; unavailable probes warn                          | [Format](https://llmstxt.org/#format)                      |
| File size and local format-only mode                                                                                                  | Oversize warns; size within the limit and skipped networking are informational | [Proposal](https://llmstxt.org/#proposal)                  |
| Link limit reached or HTML counterpart not located                                                                                    | Coverage warning                                                               | [Proposal](https://llmstxt.org/#proposal)                  |
| `Optional` section                                                                                                                    | Ordinary section; never omitted                                                | [Changes](https://llmstxt.org/changes.html#v2-august-2026) |

The parser accepts a UTF-8 BOM, relative URLs, CRLF, a title-only file, and Markdown lists with any bullet marker. File-list items start with a link and may include a link title, balanced parentheses in the URL, and notes after a colon that wrap across lines. Introductory prose under an H2 and a summary after the preamble produce warnings. Links are extracted even from items that warn.

## Node.js library

```ts
import { validate, exitCode } from "@aiamatrix/llms-txt-validator";
const report = await validate("https://example.com", {
  maxLinks: 50,
  timeout: 10000,
  network: true,
});
console.log(report.summary);
process.exitCode = exitCode(report, "error");
```

`validate(target, options)` returns a report; `checkFormat(text, url)` returns format results and parsed links without HTTP. `exitCode(report, failOn)` applies the output policy. These exports share the CLI implementation.

## GitHub Action

```yaml
- uses: aiamatrix/llms-txt-validator@v1.0.0
  with:
    url: https://example.com
    fail-on: error
    max-links: "50"
    timeout: "10000"
```

The bundled JavaScript Action requires no dependency installation by the consuming workflow and writes a job summary. See [the example workflow](examples/validate-website.yml). For security-sensitive workflows, pin an audited commit SHA. Supply trusted URLs; validation fetches URLs found in the submitted file.

## JSON schema (version 1.0)

A successful tool invocation emits exactly these top-level fields:

```json
{
  "version": "1.0",
  "url": "https://example.com/llms.txt",
  "checkedAt": "2026-10-08T00:00:00.000Z",
  "summary": { "pass": 1, "info": 0, "warn": 0, "fail": 0 },
  "results": [
    {
      "id": "file.http",
      "status": "pass",
      "message": "llms.txt returned HTTP 200.",
      "specRef": "https://llmstxt.org/#proposal",
      "url": "https://example.com/llms.txt"
    }
  ]
}
```

`version` is the report-schema version, not the npm version. `checkedAt` is an ISO-8601 UTC timestamp. Summary values are nonnegative integer result counts. Results contain `id`, `status`, `message`, `specRef`, and `url`; statuses are `pass`, `info`, `warn`, or `fail`. IDs identify check categories and can recur for different resources. `format.section.N` numbers sections within one index. Results are sorted by URL, ID, and message. Do not parse human messages as an API. Local targets use `file:` URLs.

Tool errors in JSON mode use `{"version":"1.0","error":{"message":"..."}}` and exit code 2. They do not emit a validation report or the product-report line. Help and version options print their requested text.

## Network behavior and limitations

Node's built-in fetch ignores HTTP_PROXY and HTTPS_PROXY by default. On Node 24+, set `NODE_USE_ENV_PROXY=1` to use environment proxy settings. For a custom certificate authority, set `NODE_EXTRA_CA_CERTS` to the path of its PEM certificate file before starting Node.

- External origins receive only linked-resource HTTP and resource-type checks. Discovery, Markdown-version, HTML-counterpart, and scope checks apply only to resources on the root llms.txt origin.
- At most five link-validation tasks run concurrently. Ancillary requests within each task are sequential. Responses are cached per method and URL.
- User-Agent: `aiamatrix-llms-txt-validator/1.0.0 (+https://github.com/aiamatrix/llms-txt-validator)`.
- Redirect loops and chains beyond ten redirects fail. Response bodies are capped at 2 MiB for resource safety.
- There is no sitemap crawl, JavaScript execution, content truth verification, permission audit, or guaranteed detection of every scoped file. Scoped candidates are probed only along checked resource paths. HTTP 404/410 means an optional scope is absent; other unsuccessful probes report incomplete coverage.
- The link budget applies to index-linked resources; counterpart and scope probes can add requests. There is no total-site coverage claim. The tool does not read robots.txt, so run it only against resources you are permitted to request.
- Matching HTML counterparts is heuristic when the file URL does not uniquely identify its original page. Text/plain is accepted, but the tool does not prove that a text resource is semantically useful Markdown.
- Network access can reach local/private addresses if a supplied or linked URL points there. Use trusted inputs and an isolated runner with appropriate outbound network restrictions for untrusted sites.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Release instructions are in CONTRIBUTING.md.

## License

MIT © 2026 Polygons Media LLC.
