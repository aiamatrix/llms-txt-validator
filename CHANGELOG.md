# Changelog

## 1.0.0 — unreleased

- Initial standalone CLI, Node library, and bundled GitHub Action.
- llms.txt v2 format checks, bounded HTTP requests, discovery and scoped-index checks.
- Stable JSON report schema, local format-only mode, and test fixtures.

- Accept Markdown bullet styles, wrapped notes, link titles, and parentheses in URLs; warn on extra section prose and late summaries.
- Check external links for availability and resource type without probing those sites for discovery or scoped files.
- Run discovery once per final resource URL and kind, and remove identical results before summarizing.
- Include underlying network error codes and messages, with clear timeout messages and proxy/custom-CA guidance.
- Run the GitHub Action on Node 24 with branding, a timeout input, validated numeric inputs, and current checkout/setup-node majors.
- Add informational results for skipped networking and files within the size limit; informational results do not change exit codes.
- Generate the CLI, library, User-Agent, and bundled Action version from package.json.
- Upgrade Vitest to 5 and compatible development tools; retain separate Node 20 library/CLI runtime coverage.
- Remove internal launch and validation notes; document current checks, example output, and contributor release steps.
