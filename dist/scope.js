export function scopedCandidates(page) {
    const u = new URL(page);
    const dirs = u.pathname
        .slice(0, u.pathname.lastIndexOf("/") + 1)
        .split("/")
        .filter(Boolean);
    const result = [];
    for (let i = dirs.length; i >= 0; i--)
        result.push(new URL("/" + dirs.slice(0, i).join("/") + (i ? "/" : "") + "llms.txt", u.origin).href);
    return result;
}
export function applicable(page, indexes) {
    const p = new URL(page);
    return indexes
        .filter((s) => {
        const u = new URL(s);
        return (u.origin === p.origin && p.pathname.startsWith(u.pathname.slice(0, -8)));
    })
        .sort((a, b) => b.length - a.length)[0];
}
