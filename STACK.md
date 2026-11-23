# OmniMesh: Technology Stack

This document lists the recommended stack for OmniMesh and the reasoning behind each choice.

---

## Summary

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) with TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| State | React hooks + Zustand (client state) |
| Streaming | Server-Sent Events via Vercel AI SDK |
| Auth | Auth.js (NextAuth) |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Key encryption | Node `crypto` (AES-256-GCM) |
| AI providers | OpenAI SDK, Anthropic SDK (adapter pattern) |
| Validation | Zod |
| Hosting | Vercel |
| Tooling | ESLint, Prettier, Vitest, Playwright |

---

## Frontend

- **Next.js (App Router) + TypeScript:** full-stack framework with server components, API routes, and easy deployment. TypeScript keeps the unified message schema and adapters type-safe.
- **Tailwind CSS + shadcn/ui:** fast, consistent UI; accessible components for dialogs, dropdowns, tabs, and resizable panels.
- **react-resizable-panels:** powers the side-by-side split view with adjustable columns.
- **react-markdown + rehype-highlight:** renders Markdown and syntax-highlighted code in responses.
- **Zustand:** lightweight store for the active model selection, split-view state, and streaming buffers.

## Backend

- **Next.js Route Handlers:** endpoints for chat, vault, and conversations.
- **Vercel AI SDK (optional):** streaming helpers for consistent token streaming to the UI.
- **Provider adapters (`lib/providers/*`):** one module per provider implementing a common interface:

```ts
interface ProviderAdapter {
  id: "openai" | "anthropic";
  toProviderMessages(history: NeutralMessage[]): unknown;
  stream(params: {
    apiKey: string;
    model: string;
    history: NeutralMessage[];
  }): AsyncIterable<string>;
}
```

- **Zod:** validates all request bodies and environment variables.

## Cross-Model Context

- **Neutral message schema:** `{ role, content, model, provider, createdAt }` stored in the database.
- **Adapters** translate to and from each provider's format (for example, system prompt handling differs between providers).
- **Token counting:** `tiktoken` (or provider token-count endpoints) to detect when history exceeds a model's context window and trigger truncation or summarization.

## Database

- **PostgreSQL on Neon:** serverless Postgres with a generous free tier and easy Vercel integration.
- **Prisma:** type-safe ORM and migrations.

Core tables: `User`, `ApiKey`, `Conversation`, `Message`, `ComparisonRun`.

## Authentication

- **Auth.js (NextAuth):** email/password (credentials) plus Google and GitHub OAuth, with secure session cookies.

## API Key Vault (Security)

- **AES-256-GCM** via Node's built-in `crypto` module.
- A server-only `VAULT_MASTER_KEY` environment variable encrypts each key with a unique random IV; the auth tag is stored alongside the ciphertext.
- Only the last 4 characters are stored in plain form for display.
- Keys are decrypted only inside server route handlers at request time, and are never logged or returned to the client.
- **Upgrade path:** move the master key to a managed KMS (AWS KMS, GCP KMS, or Vault) with envelope encryption.
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit`) on auth, vault, and chat endpoints.

## Split View (Parallel Requests)

- The client opens N concurrent streaming requests (one per selected model).
- Each column renders independently, so one provider failing does not affect the others.
- Per-column latency and token usage are captured from the stream.

## Hosting and DevOps

- **Vercel:** hosting and CI-friendly deployments with preview URLs.
- **Neon:** managed Postgres.
- **GitHub + GitHub Actions:** lint, type-check, and test on every pull request.
- **Environment variables:** managed in Vercel; `.env` locally (never committed).

## Testing and Quality

- **Vitest:** unit tests for adapters, encryption helpers, and context truncation.
- **Playwright:** end-to-end tests for login, vault, chat, and split view.
- **ESLint + Prettier + Husky:** consistent code style and pre-commit checks.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Auth.js session signing |
| `NEXTAUTH_URL` | App base URL |
| `VAULT_MASTER_KEY` | 32-byte base64 key for API key encryption |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth (optional) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional) |

## Why This Stack?

- **One language (TypeScript) end to end:** shared types between UI, API, and adapters.
- **Fast to build and deploy:** Next.js + Vercel + Neon is a low-ops path from prototype to production.
- **Extensible:** the adapter pattern makes adding a new AI provider a single-file change.
- **Secure by default:** all provider calls and key handling happen server-side.

## Alternatives Considered

| Option | Note |
|---|---|
| React + Express/Node | More setup; separate deployments |
| FastAPI (Python) backend | Good for ML-heavy work; not needed since all models are called via APIs |
| MongoDB | Flexible schema, but relational data (users, keys, conversations) fits Postgres better |
| Supabase | Viable all-in-one alternative for auth + database |
