# Repo 1 launch steps

## Current state

This is a standalone release candidate, not a published package. The private AIA Matrix repository stays private; nothing needs to be transferred from it. Repository creation, npm ownership, trusted publishing, and the first release remain account setup steps.

## Create the GitHub organization and repository

1. Sign in to GitHub as the account that should own the organization.
2. Open https://github.com/organizations/plan and create an organization named `aiamatrix`, if GitHub accepts that name. Use the business contact address and choose the plan you need. Do not transfer or change the visibility of the private product repository.
3. Create a new **public** repository under that organization named `llms-txt-validator`. Start empty: the supplied project already includes its README, license, and ignore rules.
4. Set its description to: **CLI, Node library, and GitHub Action for validating llms.txt v2 format, links, Markdown discovery, and scoped indexes.**
5. Set the website field to https://aiamatrix.com and topics to `llms-txt`, `ai-readiness`, `seo`, `geo`, and `validator`. These topics describe the area; they do not promise rankings or citations.
6. Extract this project and upload only its files. Do not run these commands inside the private product repository:

```sh
cd llms-txt-validator
npm ci
npm run build
npm run lint
npm test
git init -b main
git add .
git commit -m "Initial standalone llms.txt validator"
git remote add origin https://github.com/aiamatrix/llms-txt-validator.git
git push -u origin main
```

7. Protect `main` with pull-request review and the CI checks. Enable Issues and Discussions if you can maintain them.

## Release checklist

- Confirm npm scope ownership; package availability alone does not establish permission to publish under `@aiamatrix`.
- Recheck `npm view @aiamatrix/llms-txt-validator version`. A 404 does not reserve the name and can also mean you lack access.
- Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, and `npm pack --dry-run`.
- Run `gitleaks dir .` against the isolated project, excluding dependency/cache directories if necessary. Review findings and never solve private-data findings by merely hiding them from the scanner.
- Inspect the packed files; confirm no Firebase config, environment files, scanner/scoring code, prompts, customer data, or private/internal URLs appear.
- Commit rebuilt `dist/`; verify CI passes on the public repository.
- Add working CI, npm-version, and MIT badges to README **after** the repository/package exists. Do not display successful status badges before their targets exist.
- Configure the npm package's trusted publisher for organization `aiamatrix`, repository `llms-txt-validator`, workflow `publish.yml`, environment `npm`. Initial authenticated publication may be necessary before the package's settings exist; use your own npm account, never a credential committed to code.
- Set up the `npm` GitHub environment and choose any desired protection rules.
- Change CHANGELOG from unreleased to the release date, commit it, then create and push `v1.0.0`. The tag must match package.json. Confirm the npm publish succeeds and the installed CLI works.
- Create a GitHub release for `v1.0.0`; add a moving `v1` Action tag only if you intend to maintain it.
- After the repository is public and the npm package is verified, add a GitHub link to the aiamatrix.com footer through a separate product-repository change. That footer change is not included here.

## Integration pull-request draft — use only after v1.0 publication

Title: Add llms.txt Validator to Integrations

Add `@aiamatrix/llms-txt-validator`, an MIT-licensed CLI, Node.js library, and GitHub Action maintained by Polygons Media LLC. It checks llms.txt v2 format, linked resources, Markdown discovery relations, and scoped indexes. It supports local format-only checks and JSON reports.

Repository: https://github.com/aiamatrix/llms-txt-validator
npm: https://www.npmjs.com/package/@aiamatrix/llms-txt-validator

Validation does not establish AI retrieval, citations, rankings, or traffic. Submit this text only after both links are live and v1.0.0 has been verified. Inspect the llmstxt.org repository's current contribution instructions before submitting; no upstream pull request has been sent.

## Deferred projects

The methodology, templates, and organization-profile repositories are deferred until Repo 1 is published. The later WordPress plugin would need Markdown page rendering, per-page alternate/describedby relations, scoped-index support, caching/invalidation, permission-aware content exclusion, validation tests, and WordPress compatibility/security review. It must not expose private drafts or restricted content.
