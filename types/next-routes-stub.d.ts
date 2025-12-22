/**
 * Fallback stubs so TypeScript doesn't fail before Next.js generates route types.
 * The real files are created after running `next dev` or `next build`.
 */
declare module './.next/types/routes.d.ts' {
  export {};
}

declare module './.next/dev/types/routes.d.ts' {
  export {};
}
