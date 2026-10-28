export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512';
export type Digest = { hex: string; b64: string };
export interface Entry {
  name: string;
  path: string;
  parent: string;
  dir: boolean;
  size: number | null;
  modifiedAt: string;
  hashes?: Partial<Record<HashAlgorithm, Digest>>;
}
export interface Catalog {
  entries: Entry[];
  revision: string;
  builtAt: string;
}
export type Language = 'zh-CN' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type Sort =
  'name' | 'name-desc' | 'date' | 'date-asc' | 'size' | 'size-asc';
