# Validation report

Repo 1 is built as an unpublished release candidate.

- ESLint passed.
- Vitest: 37 tests passed across seven files.
- TypeScript compilation and bundled Action build passed.
- Actual CLI and Action execution tests passed, including JSON and job-summary output.
- Local HTTP CLI fixture: 15 pass, 0 warn, 0 fail.
- Rebuilding produced no changes to committed dist files.
- Runtime npm audit: zero reported vulnerabilities at the time checked.
- Gitleaks v8.30.1 scanned the isolated repository's committed files: no leaks found.
- Public-content exclusion check found no prohibited private references or configuration files.
- npm pack dry run passed; bundled dependency license notices included.

GitHub organization lookup and npm package lookup both returned 404 on October 8, 2026. This does not reserve either name or establish ownership. GitHub and npm publication have not occurred. The private product repository was not changed.

This report records checks performed here; hosted CI and npm publishing require account setup.
