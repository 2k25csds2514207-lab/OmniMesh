# OmniMesh

**One login. Every top AI model. Zero tab-switching.**

OmniMesh is a unified multi-model AI workspace. Log in once and talk to leading models such as GPT-4o and Claude in a single interface, compare their answers side by side, and keep your conversation context intact when you switch between models.

---

## Why OmniMesh?

Working with several AI models today means juggling tabs, accounts, and copy-pasting prompts and context between them. OmniMesh removes that friction:

- **No tab-switching:** all your models live in one workspace.
- **No lost context:** switch models mid-conversation without re-explaining anything.
- **No guesswork:** send one prompt to multiple models and compare outputs instantly.
- **No key sprawl:** store your provider API keys in one encrypted vault.

---

## Key Features

### 1. Unified Multi-Model Workspace
Interact with multiple AI providers (OpenAI GPT-4o, Anthropic Claude, and more) from one interface after a single login.

### 2. Secure API Key Vault
Bring your own API keys. Keys are encrypted at rest (AES-256-GCM), never exposed to the browser after saving, and only decrypted server-side at request time.

### 3. Cross-Model Context Preservation
Conversations are stored in a provider-neutral format. Switch from one model to another and the full history carries over automatically.

### 4. Side-by-Side Split View
Send a single prompt to two or more models at once and view streaming responses in parallel columns for quick comparison.

---

## How It Works

```
User ──► OmniMesh UI ──► API Layer ──► Provider Adapters ──► GPT-4o / Claude / ...
                              │
                              ├── Key Vault (encrypted)
                              └── Unified Conversation Store
```

1. User signs in and adds provider API keys to the vault.
2. User starts a chat and selects one or more models.
3. The API layer loads the unified conversation history, translates it via the matching provider adapter, and streams the response back.
4. Responses are saved in the neutral format so any model can continue the thread.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or hosted, e.g. Neon)
- At least one provider API key (OpenAI, Anthropic, etc.)

### Installation

```bash
git clone https://github.com/<your-username>/omnimesh.git
cd omnimesh
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/omnimesh"
AUTH_SECRET="generate-a-long-random-string"
VAULT_MASTER_KEY="32-byte-base64-key-for-encrypting-api-keys"
NEXTAUTH_URL="http://localhost:3000"
```

> Generate secrets with: `openssl rand -base64 32`

### Run Locally

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
omnimesh/
├── app/                 # Next.js App Router (pages, API routes)
├── components/          # UI components (chat, split view, vault)
├── lib/
│   ├── providers/       # Provider adapters (openai.ts, anthropic.ts, ...)
│   ├── vault/           # Encryption / decryption helpers
│   └── context/         # Unified message format + conversion
├── prisma/              # Database schema and migrations
├── PRD.md               # Product requirements
├── STACK.md             # Technology stack
└── README.md
```

---

## Roadmap

- [x] Project definition and documentation
- [ ] Authentication and user accounts
- [ ] API key vault
- [ ] Single-model chat with streaming
- [ ] Cross-model context switching
- [ ] Split-view comparison
- [ ] Additional providers (Gemini, Mistral, etc.)
- [ ] Prompt library and shareable comparisons

---

## Security

- API keys are encrypted at rest and never returned to the client after saving.
- All provider calls are made server-side.
- Users can delete keys and conversations at any time.

See `PRD.md` for the full security requirements.

---

## Documentation

- [Product Requirements (PRD.md)](./PRD.md)
- [Technology Stack (STACK.md)](./STACK.md)

---

## License

MIT
