# Contributing

Use Node.js 22.13 or newer for development (Node 24 is recommended). The published library and CLI support Node.js 20+, which CI checks separately without development dependencies. Install with `npm ci`, then run `npm run lint`, `npm test`, and `npm run build`. Commit generated `dist/` changes with source changes. Add a fixture or mocked HTTP test for changed validation behavior.

Keep specification requirements separate from recommendations and tool policy. Include a specification reference when proposing a check. Avoid promises about citations, rankings, or traffic.

Do not contribute API keys, environment files, private product code, customer content, internal URLs, or configuration. Use example.com fixtures and mocked networking. Submit a focused pull request describing behavior and validation. Security concerns go to contact@aiamatrix.com rather than a public issue.
