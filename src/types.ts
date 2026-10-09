export type Status = "pass" | "warn" | "fail";
export interface Result {
  id: string;
  status: Status;
  message: string;
  specRef: string;
  url: string;
}
export interface Report {
  version: "1.0";
  url: string;
  checkedAt: string;
  summary: Record<Status, number>;
  results: Result[];
}
export interface Options {
  maxLinks?: number;
  timeout?: number;
  failOn?: "warn" | "error";
  network?: boolean;
}
export interface Resource {
  url: string;
  status: number;
  headers: Headers;
  body: string;
}
