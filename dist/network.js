import { VERSION } from "./spec.js";
export class Client {
    timeout;
    cache = new Map();
    constructor(timeout) {
        this.timeout = timeout;
    }
    async request(url, method = "GET") {
        const key = method + " " + url;
        const existing = this.cache.get(key);
        if (existing)
            return existing;
        const pending = this.fetch(url, method);
        this.cache.set(key, pending);
        return pending;
    }
    async fetch(url, method) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        try {
            let current = url;
            const seen = new Set();
            for (let n = 0; n <= 10; n++) {
                if (seen.has(current))
                    throw Error("Redirect loop");
                seen.add(current);
                const parsed = new URL(current);
                if (!["http:", "https:"].includes(parsed.protocol))
                    throw Error("Only HTTP(S) URLs are supported");
                const response = await fetch(current, {
                    method,
                    redirect: "manual",
                    signal: controller.signal,
                    headers: {
                        "User-Agent": `aiamatrix-llms-txt-validator/${VERSION} (+https://github.com/aiamatrix/llms-txt-validator)`,
                    },
                });
                if ([301, 302, 303, 307, 308].includes(response.status)) {
                    const location = response.headers.get("location");
                    await response.body?.cancel();
                    if (!location)
                        throw Error("Redirect missing Location");
                    current = new URL(location, current).href;
                    continue;
                }
                const reader = response.body?.getReader();
                const chunks = [];
                let bytes = 0;
                if (reader)
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        bytes += value.length;
                        if (bytes > 2 * 1024 * 1024) {
                            await reader.cancel();
                            throw Error("Response exceeds 2 MiB safety limit");
                        }
                        chunks.push(value);
                    }
                return {
                    url: current,
                    status: response.status,
                    headers: response.headers,
                    body: Buffer.concat(chunks).toString("utf8"),
                };
            }
            throw Error("More than 10 redirects");
        }
        finally {
            clearTimeout(timer);
        }
    }
    async resolve(url) {
        try {
            const head = await this.request(url, "HEAD");
            if (head.status === 200)
                return head;
        }
        catch {
            /* Retry with GET. */
        }
        return this.request(url);
    }
}
export async function pooled(items, work) {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(5, items.length) }, async () => {
        while (next < items.length) {
            const item = items[next++];
            await work(item);
        }
    }));
}
