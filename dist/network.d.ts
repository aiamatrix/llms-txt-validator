import type { Resource } from "./types.js";
export declare function networkMessage(error: unknown, timeout?: number): string;
export declare class Client {
    private timeout;
    private cache;
    constructor(timeout: number);
    request(url: string, method?: string): Promise<Resource>;
    private fetch;
    resolve(url: string): Promise<Resource>;
}
export declare function pooled<T>(items: T[], work: (item: T) => Promise<void>): Promise<void>;
