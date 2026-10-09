export interface Relation {
    href: string;
    rel: string;
    type?: string;
}
export declare function relations(body: string, header: string | null, base: string): Relation[];
export declare const hasRel: (r: Relation, name: string) => boolean;
