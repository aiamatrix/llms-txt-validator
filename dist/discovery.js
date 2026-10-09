import { parse } from "parse5";
export function relations(body, header, base) {
    const out = [];
    const add = (href, rel, type) => {
        try {
            out.push({ href: new URL(href, base).href, rel, type });
        }
        catch {
            /* Invalid relation is not usable. */
        }
    };
    for (const match of (header ?? "").matchAll(/<([^>]+)>((?:\s*;\s*[\w-]+\s*=\s*(?:"[^"]*"|[^;,]+))*)/g)) {
        const attrs = new Map();
        for (const a of match[2].matchAll(/;\s*([\w-]+)\s*=\s*(?:"([^"]*)"|([^;,]+))/g))
            attrs.set(a[1].toLowerCase(), (a[2] ?? a[3]).trim());
        add(match[1], attrs.get("rel") ?? "", attrs.get("type"));
    }
    const document = parse(body);
    let effective = base;
    const walk = (node, visit) => {
        const n = node;
        if (n.tagName)
            visit(n.tagName, new Map((n.attrs ?? []).map((a) => [a.name, a.value])));
        for (const child of n.childNodes ?? [])
            walk(child, visit);
    };
    let foundBase = false;
    walk(document, (tag, a) => {
        if (tag === "base" && a.has("href") && !foundBase) {
            try {
                effective = new URL(a.get("href"), base).href;
                foundBase = true;
            }
            catch {
                /* Ignore invalid base. */
            }
        }
    });
    walk(document, (tag, a) => {
        if (tag === "link" && a.has("href")) {
            try {
                out.push({
                    href: new URL(a.get("href"), effective).href,
                    rel: a.get("rel") ?? "",
                    type: a.get("type"),
                });
            }
            catch {
                /* Ignore invalid link. */
            }
        }
    });
    return out;
}
export const hasRel = (r, name) => r.rel.toLowerCase().split(/\s+/).includes(name);
