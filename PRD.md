# OmniMesh: Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Draft

---

## 1. Overview

OmniMesh is a unified multi-model AI workspace that lets users log in once and interact with top-tier AI models (e.g. GPT-4o, Claude) in one interface. It offers a secure API key vault, cross-model context preservation, and a side-by-side split view for comparing models.

## 2. Problem Statement

People who use multiple AI models face:

1. **Tab and account sprawl:** separate sites, logins, and subscriptions per provider.
2. **Context loss:** moving a conversation to another model means copy-pasting history.
3. **Hard comparison:** evaluating which model answers best requires manually running the same prompt in several places.
4. **Scattered API keys:** developers manage keys across tools with no secure central place.

## 3. Goals and Non-Goals

### Goals
- One login, one workspace, many models.
- Preserve conversation context when switching models.
- Make comparing models effortless via split view.
- Store user API keys securely.

### Non-Goals (v1)
- Training or fine-tuning models.
- Hosting or reselling model access (users bring their own keys).
- Image, audio, or video generation.
- Team/enterprise workspaces and billing.

## 4. Target Users

| Persona | Needs |
|---|---|
| **Student / learner** | Compare explanations from different models without multiple tabs |
| **Developer** | Test prompts across models, manage keys in one place |
| **Researcher / writer** | Pick the best output, continue the same thread in another model |
| **Prompt engineer** | Systematic side-by-side evaluation |

## 5. User Stories

1. As a user, I can sign up and log in once to access all my models.
2. As a user, I can add, update, and delete my provider API keys in a secure vault.
3. As a user, I can start a chat and choose which model answers.
4. As a user, I can switch the model mid-conversation and the new model sees the full history.
5. As a user, I can open split view, send one prompt, and see multiple models respond side by side.
6. As a user, I can continue a conversation with whichever model's answer I prefer.
7. As a user, I can view, rename, and delete past conversations.

## 6. Functional Requirements

### 6.1 Authentication
- FR-1: Email/password and OAuth (Google, GitHub) sign-in.
- FR-2: Session management with secure cookies.

### 6.2 API Key Vault
- FR-3: Users can add keys per provider (OpenAI, Anthropic, others later).
- FR-4: Keys are encrypted at rest with AES-256-GCM using a server-side master key.
- FR-5: After saving, only a masked preview (e.g. `sk-...a1b2`) is ever shown; the full key is never sent back to the client.
- FR-6: Users can validate, replace, and delete keys.
- FR-7: Keys are decrypted only server-side, only at request time, and never logged.

### 6.3 Chat
- FR-8: Streaming responses token by token.
- FR-9: Model selector per conversation, with per-message model attribution.
- FR-10: Stop generation, regenerate, and edit-and-resend.
- FR-11: Markdown and code block rendering with copy button.

### 6.4 Cross-Model Context Preservation
- FR-12: All messages are stored in a provider-neutral schema (role, content, model, timestamp, metadata).
- FR-13: Provider adapters translate neutral history into each provider's request format.
- FR-14: When switching models, the full history (within the target model's context window) is passed automatically.
- FR-15: If history exceeds the target model's context limit, the app truncates or summarizes older turns and notifies the user.

### 6.5 Split View
- FR-16: Users can select 2 to 4 models to run in parallel columns.
- FR-17: One prompt is dispatched to all selected models concurrently; responses stream independently.
- FR-18: Each column shows latency and token usage.
- FR-19: Users can "adopt" one response to continue the main thread with that model.
- FR-20: Failure in one column (bad key, rate limit) does not block the others, and shows a clear error.

### 6.6 Conversation Management
- FR-21: List, search, rename, pin, and delete conversations.
- FR-22: Export a conversation as Markdown or JSON.

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Security** | Encrypted keys, HTTPS only, server-side provider calls, rate limiting, input validation |
| **Privacy** | No training on user data; user can delete all data; keys and prompts are never logged |
| **Performance** | First token shown within provider latency + under 300 ms overhead; split view responses stream in parallel |
| **Reliability** | Graceful handling of provider outages and rate limits |
| **Usability** | Responsive layout; split view collapses to tabs on mobile; keyboard shortcuts |
| **Accessibility** | WCAG 2.1 AA target |

## 8. Data Model (High Level)

- **User**: id, email, auth info
- **ApiKey**: id, userId, provider, encryptedKey, iv, authTag, last4, createdAt
- **Conversation**: id, userId, title, createdAt, updatedAt
- **Message**: id, conversationId, role, content, model, provider, tokens, createdAt
- **ComparisonRun**: id, conversationId, promptMessageId, list of response message ids

## 9. UX Outline

1. **Login / Onboarding:** sign in, prompted to add a first API key.
2. **Workspace:** left sidebar (conversations), center chat, top bar with model selector and split-view toggle.
3. **Vault page:** list of providers, masked keys, add/validate/delete.
4. **Split view:** N equal columns, shared input box at the bottom, per-column "Use this response" action.

## 10. Success Metrics

- Time to first successful multi-model comparison under 3 minutes from signup.
- Percentage of conversations that switch models at least once.
- Split view usage per active user per week.
- Zero security incidents involving key exposure.
- Day-7 retention.

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| API key leakage | Encryption at rest, server-only decryption, no logging, masked display |
| Provider API changes | Adapter pattern isolates provider-specific code |
| Context window mismatch across models | Token counting, truncation/summarization with user notice |
| Rate limits and costs on user keys | Show usage per request, clear error messages |
| Inconsistent response formats | Normalize to the neutral message schema |

## 12. Milestones

| Phase | Scope |
|---|---|
| **M1: Foundation** | Auth, database, base UI shell |
| **M2: Vault** | Encrypted key storage and validation |
| **M3: Chat** | Single-model streaming chat with history |
| **M4: Context Switching** | Neutral schema, adapters, mid-chat model switch |
| **M5: Split View** | Parallel multi-model queries and comparison UI |
| **M6: Polish** | Export, search, error handling, accessibility, deployment |

## 13. Future Scope

- More providers (Gemini, Mistral, Llama via hosted APIs).
- Shareable comparison links.
- Prompt library and templates.
- Automatic model-vs-model scoring.
- Team workspaces.
