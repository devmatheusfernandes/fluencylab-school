---
name: "DataFetching"
description: "Audits and standardizes Next.js/React data fetching (SWR + Server Components) with a checklist and guided refactors. Invoke when user asks to review/fix data fetching patterns."
---

# Data Fetching

Use this skill to audit, standardize, and refactor data fetching in a Next.js (App Router) codebase.

## When to Invoke

Invoke when the user asks to:

- Review whether data fetching patterns are correct/idiomatic
- Create a data fetching checklist for the project
- Reduce duplicated `useEffect + fetch + useState` patterns
- Introduce a consistent client fetching strategy (SWR) and mutation revalidation
- Move fetching to Server Components where appropriate
- Identify which files need changes for consistency

## Outcomes

This skill should produce:

- A clear checklist the project can follow
- A file list of current pattern violations (by category)
- Concrete refactors (in code) for a few representative flows, following existing conventions
- Verification (lint/typecheck/tests as available)

## Checklist (Project Standard)

### 1) Classify State

- Server state: data from backend (lists, details, status, history)
- UI state: local interaction (modals, filters, selected rows, wizard steps)

### 2) Choose Strategy

- Prefer Server Components for initial page loads when:
  - Data is needed to render the page
  - It does not require browser-only APIs
  - You want SEO/faster first paint and fewer client roundtrips
- Prefer SWR in Client Components when:
  - Data must refresh while user is on the page
  - The same data is reused across multiple client components
  - The page is interactive and benefits from cache + dedupe

### 3) Centralize GETs in Hooks

- No `fetch()` directly inside page/components for GETs
- Create hooks in `hooks/**` that expose:
  - `data`, `isLoading`, `error`, and `mutate`

### 4) Standardize Fetcher

Use one shared fetcher pattern that:

- Throws on non-2xx with a useful message
- Returns typed JSON

Example pattern:

```ts
export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && (body.error || body.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
```

### 5) Mutations Revalidate Server State

- Mutations remain `fetch()` calls
- After mutation success, revalidate affected keys:
  - `await mutate("/api/...")` or `await Promise.all([mutate(k1), mutate(k2)])`
- Use optimistic updates only when UX needs it and data shape is stable

### 6) Keep Loading/Error UI Consistent

- Hooks manage networking state
- Components render:
  - Skeleton while loading
  - Error UI when error
  - Empty UI when data is empty

### 7) Validate API Inputs

- All `/api` routes validate:
  - `body` with Zod for POST/PATCH/PUT
  - `query` with Zod for query params
  - `params` with Zod for dynamic route params

## Audit Procedure

Follow this sequence:

1. Find client files using `useEffect` + `fetch` for GETs.
2. Find hooks that manually fetch + maintain `isLoading`/`error`.
3. Check how many patterns exist (SWR vs manual) and pick the standard (usually SWR for client GET).
4. Identify pages that could become Server Components:
   - pages that only fetch data + render UI
   - pages that do not need `useSession()` in the client
5. Implement refactors in small batches:
   - convert one flow end-to-end (GET + mutation revalidation)
   - ensure behavior matches before moving on

## Refactor Playbook

### Converting a page that fetches in `useEffect`

Before:

- Page has `useEffect(() => fetch(...), [])`
- Local `loading/error/data` state

After:

- Create `useXxx()` hook using SWR
- Page calls `const { data, isLoading, error } = useXxx()`
- Mutations trigger SWR revalidation

### Moving fetching to Server Component

Use when:

- Page does not need browser APIs
- You can get the session on the server (if needed)

Approach:

- Remove `"use client"` from the `page.tsx`
- Fetch on the server using `await` and pass results to a client component for interactivity (if necessary)

## What to Change in This Codebase

Prioritize:

- Client pages with `fetch()` inside `useEffect` for GETs
- Hooks that replicate cache/retry/dedupe logic manually
- Places where multiple components fetch the same endpoint independently

Defer:

- Deep architectural changes that would require new libraries
- Large rewrites without tests or a clear verification path

## Verification Steps

After each refactor batch:

- Run lint
- Run typecheck (if configured)
- Smoke-test the refactored pages (local dev server if appropriate)
