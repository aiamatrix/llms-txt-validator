# Contributing

Use Node.js 22.13 or newer for development (Node 24 is recommended). The published library and CLI support Node.js 20+, which CI checks separately without development dependencies. Install with `npm ci`, then run `npm run lint`, `npm test`, and `npm run build`. Commit generated `dist/` changes with source changes. Add a fixture or mocked HTTP test for changed validation behavior.

Keep specification requirements separate from recommendations and tool policy. Include a specification reference when proposing a check. Avoid promises about citations, rankings, or traffic.

Do not contribute API keys, environment files, private product code, customer content, internal URLs, or configuration. Use example.com fixtures and mocked networking. Submit a focused pull request describing behavior and validation. Security concerns go to contact@aiamatrix.com rather than a public issue.

## Releasing

```sh
npm ci
npm run lint
npm test
npm run build
npm pack --dry-run
```

CI runs on pushes and pull requests. Commit the generated `dist/` bundle so GitHub Actions work directly from tags. CI verifies that rebuilding does not change it.

Before the first release, confirm ownership of the `aiamatrix` GitHub organization and npm scope, configure npm trusted publishing for this repository and `publish.yml`, configure the `npm` GitHub environment, and confirm the package name is available. The tag-triggered workflow uses OIDC; no npm token belongs in this repository. Trusted publishing setup may require initially creating the npm package through an authenticated npm account.

Version the package, update CHANGELOG, build and commit `dist/`, run all checks and a secrets scan, then create `v1.0.0`. A tag matching package.json triggers npm publishing. Publication and the llmstxt.org integration submission are separate launch steps.
