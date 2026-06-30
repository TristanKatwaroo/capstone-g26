// Shared client-side config.
//
// API_BASE_URL is the address of the Express backend. It's read from the
// NEXT_PUBLIC_API_BASE_URL env var so deployed builds can point at the
// production backend, falling back to the local dev server when unset.
// (Next.js only exposes vars prefixed with NEXT_PUBLIC_ to browser code.)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
