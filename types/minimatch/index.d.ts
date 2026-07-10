// Minimal stub type declarations to satisfy TypeScript's implicit minimatch type lookup.
declare module "minimatch" {
  export function match(path: string, patterns: string | string[], options?: any): string[];
  export interface IMinimatch {
    set: string[][];
  }
  export default function minimatch(path: string, pattern: string, options?: any): boolean;
}
