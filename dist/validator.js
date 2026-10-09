import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkFormat } from "./format.js";
import { Client, pooled, networkMessage } from "./network.js";
import { relations, hasRel } from "./discovery.js";
import { markdownCandidates, pageCandidates } from "./markdown-versions.js";
import { scopedCandidates, applicable } from "./scope.js";
import { SPEC } from "./spec.js";
export async function validate(target, options = {}) {
    const max = options.maxLinks ?? 50;
    const timeout = options.timeout ?? 10000;
    if (!Number.isInteger(max) ||
        max < 0 ||
        !Number.isInteger(timeout) ||
        timeout < 1)
        throw Error("maxLinks must be a nonnegative integer; timeout must be a positive integer");
    const remote = /^https?:\/\//i.test(target);
    const network = remote && options.network !== false;
    const results = [];
    const add = (id, status, message, url, specRef = SPEC.proposal) => results.push({ id, status, message, url, specRef });
    let url = remote ? new URL(target).href : pathToFileURL(resolve(target)).href;
    if (remote) {
        const u = new URL(url);
        if (!u.pathname.endsWith("/llms.txt")) {
            u.pathname = u.pathname.replace(/\/$/, "") + "/llms.txt";
            u.search = "";
            u.hash = "";
        }
        url = u.href;
    }
    let rootOrigin = remote ? new URL(url).origin : "";
    const sameOrigin = (resourceUrl) => new URL(resourceUrl).origin === rootOrigin;
    const client = new Client(timeout);
    const indexes = new Set();
    const visited = new Set();
    const checkedDiscovery = new Set();
    const pendingIndexes = new Map();
    const linkQueue = [];
    const queued = new Set();
    let truncated = false;
    const isText = (r) => /^text\/(plain|markdown)\b/i.test(r.headers.get("content-type") ?? "");
    const isHtml = (r) => /text\/html/i.test(r.headers.get("content-type") ?? "") ||
        /^\s*(?:<!doctype\s+html|<html|<head|<body)/i.test(r.body.replace(/^\uFEFF/, ""));
    const enqueue = (link, base) => {
        try {
            const u = new URL(link, base);
            if (!["http:", "https:"].includes(u.protocol)) {
                add("links.protocol", "fail", "Linked resource must use HTTP(S).", u.href);
                return;
            }
            u.hash = "";
            if (!queued.has(u.href)) {
                queued.add(u.href);
                if (queued.size <= max)
                    linkQueue.push(u.href);
                else
                    truncated = true;
            }
        }
        catch {
            add("links.url", "fail", "Invalid link URL.", base);
        }
    };
    const index = (indexUrl, resource) => {
        const existing = pendingIndexes.get(indexUrl);
        if (existing)
            return existing;
        visited.add(indexUrl);
        const pending = (async () => {
            try {
                const r = resource ?? (await client.request(indexUrl));
                add("file.http", r.status === 200 ? "pass" : "fail", `llms.txt returned HTTP ${r.status}.`, indexUrl);
                if (r.status !== 200)
                    return;
                if (indexUrl === url)
                    rootOrigin = new URL(r.url).origin;
                indexes.add(indexUrl);
                add("file.content-type", isText(r) ? "pass" : "fail", "llms.txt must use text/plain or text/markdown.", indexUrl);
                add("file.not-html", isHtml(r) ? "fail" : "pass", "llms.txt must not be an HTML document.", indexUrl);
                if (isHtml(r))
                    return;
                const parsed = checkFormat(r.body, indexUrl);
                results.push(...parsed.results);
                for (const l of parsed.links)
                    enqueue(l, r.url);
            }
            catch (e) {
                add("file.fetch", "fail", networkMessage(e, timeout), indexUrl);
            }
        })();
        pendingIndexes.set(indexUrl, pending);
        return pending;
    };
    if (!network) {
        if (remote)
            throw Error("--no-network requires a local file; a remote URL cannot be checked without fetching it");
        const text = await readFile(resolve(target), "utf8");
        results.push(...checkFormat(text, url).results);
        add("network.skipped", "pass", "Format-only mode: network, discovery and scope checks were not performed.", url);
    }
    else {
        await index(url);
        const discoverScope = async (page) => {
            if (!sameOrigin(page))
                return;
            for (const candidate of scopedCandidates(page)) {
                if (visited.has(candidate)) {
                    await pendingIndexes.get(candidate);
                    continue;
                }
                try {
                    const r = await client.request(candidate);
                    if (r.status === 200)
                        await index(candidate, r);
                    else if (r.status !== 404 && r.status !== 410)
                        add("scope.unavailable", "warn", `Scope probe returned HTTP ${r.status}; coverage is incomplete.`, candidate);
                }
                catch (e) {
                    add("scope.unavailable", "warn", networkMessage(e, timeout), candidate);
                }
            }
        };
        const checkDiscovery = async (r, html) => {
            if (!sameOrigin(r.url))
                return;
            const key = `${r.url} ${html ? "html" : "md"}`;
            if (checkedDiscovery.has(key))
                return;
            checkedDiscovery.add(key);
            await discoverScope(r.url);
            const expected = applicable(r.url, [...indexes]);
            const rels = relations(html ? r.body : "", r.headers.get("link"), r.url);
            add("discovery.describedby", expected &&
                rels.some((x) => hasRel(x, "describedby") && x.href === expected)
                ? "pass"
                : "warn", expected
                ? `Expected describedby relation to ${expected}.`
                : "No applicable llms.txt found.", r.url);
            if (html) {
                const alternate = rels.find((x) => hasRel(x, "alternate") && x.type?.toLowerCase() === "text/markdown");
                add("discovery.alternate", alternate ? "pass" : "warn", "HTML should advertise a text/markdown alternate.", r.url);
                let exists = false;
                for (const candidate of markdownCandidates(r.url)) {
                    try {
                        const md = await client.request(candidate);
                        if (md.status === 200 && isText(md) && !isHtml(md)) {
                            exists = true;
                            await checkDiscovery(md, false);
                            break;
                        }
                    }
                    catch {
                        /* Try next allowed URL form. */
                    }
                }
                add("markdown.version", exists ? "pass" : "warn", "Check for a Markdown version at a v2 URL form.", r.url);
                if (alternate && !markdownCandidates(r.url).includes(alternate.href))
                    add("discovery.alternate-url", "warn", "Alternate URL does not use a same-page v2 Markdown URL form.", r.url);
            }
        };
        let offset = 0;
        while (offset < linkQueue.length) {
            const batch = linkQueue.slice(offset);
            offset = linkQueue.length;
            await pooled(batch, async (link) => {
                try {
                    const head = await client.resolve(link);
                    add("links.http", head.status === 200 ? "pass" : "fail", `Linked resource returned HTTP ${head.status}.`, link);
                    if (head.status !== 200)
                        return;
                    if (sameOrigin(link) &&
                        sameOrigin(head.url) &&
                        new URL(link).pathname.endsWith("/llms.txt")) {
                        await index(link);
                        return;
                    }
                    const r = await client.request(link);
                    if (r.status !== 200) {
                        add("links.get", "fail", `GET returned HTTP ${r.status}.`, link);
                        return;
                    }
                    const html = isHtml(r);
                    add("links.resource-type", html || !isText(r) ? "warn" : "pass", html
                        ? "Linked resource is HTML rather than Markdown or text."
                        : "Check linked resource content type.", link);
                    if (!sameOrigin(link) || !sameOrigin(r.url))
                        return;
                    await checkDiscovery(r, html);
                    if (!html && new URL(r.url).pathname.endsWith(".md")) {
                        let found = false;
                        for (const page of pageCandidates(r.url)) {
                            try {
                                const p = await client.request(page);
                                if (p.status === 200 && isHtml(p)) {
                                    found = true;
                                    await checkDiscovery(p, true);
                                    break;
                                }
                            }
                            catch {
                                /* Try next counterpart. */
                            }
                        }
                        if (!found)
                            add("markdown.source-page", "warn", "Could not locate the HTML counterpart; HTML discovery was not verified.", r.url);
                    }
                }
                catch (e) {
                    add("links.fetch", "fail", networkMessage(e, timeout), link);
                }
            });
        }
        if (truncated)
            add("links.limit", "warn", `Link limit ${max} reached; remaining linked resources were not checked.`, url);
    }
    const unique = [
        ...new Map(results.map((r) => [
            JSON.stringify([r.id, r.url, r.status, r.message]),
            r,
        ])).values(),
    ];
    unique.sort((a, b) => a.url.localeCompare(b.url) ||
        a.id.localeCompare(b.id) ||
        a.message.localeCompare(b.message));
    const summary = { pass: 0, warn: 0, fail: 0 };
    for (const r of unique)
        summary[r.status]++;
    return {
        version: "1.0",
        url,
        checkedAt: new Date().toISOString(),
        summary,
        results: unique,
    };
}
