# Changelog

## 1.0.0 — 2026-10-09

- CLI, Node.js library, and bundled GitHub Action with a Node 24 runtime, job summary, and `url`, `fail-on`, `max-links`, and `timeout` inputs.
- llms.txt v2 format checks for H1, optional summary, sections, and file lists, accepting any bullet style, wrapped notes, and link titles.
- Linked-resource checks for HTTP 200 and resource type, using HEAD with GET fallback; same-origin-only discovery checks for Markdown versions, alternate/describedby relations, and scoped llms.txt files.
- `pass`, `info`, `warn`, and `fail` result levels; exit codes 0, 1, and 2; stable JSON report schema 1.0.
- Network safeguards with timeouts, redirect and response-size limits, five concurrent requests, descriptive error codes, and proxy/custom-CA guidance.
- Local format-only validation with no telemetry.
