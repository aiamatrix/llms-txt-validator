export function markdownCandidates(page) {
    const u = new URL(page);
    const path = u.pathname;
    const paths = path.endsWith("/")
        ? [path + "index.md", path + "index.html.md"]
        : [path + ".md", path.replace(/\.[^/.]+$/, ".md")];
    return [
        ...new Set(paths.map((p) => {
            const v = new URL(u);
            v.pathname = p;
            return v.href;
        })),
    ];
}
export function pageCandidates(markdown) {
    const u = new URL(markdown);
    if (!u.pathname.endsWith(".md"))
        return [];
    const path = u.pathname.slice(0, -3);
    const paths = path.endsWith("/index")
        ? [path.slice(0, -5), path + ".html"]
        : path.endsWith("/index.html")
            ? [path.slice(0, -10), path]
            : [path, ...(!/\.[^/]+$/.test(path) ? [path + ".html"] : [])];
    return [
        ...new Set(paths.map((p) => {
            const v = new URL(u);
            v.pathname = p;
            return v.href;
        })),
    ];
}
