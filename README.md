# TripHunt Frontend

The TripHunt web application — a travel DAO governance frontend built on the Cardano blockchain. Members connect their Cardano wallets, submit trip proposals with photo/video media, vote on proposals, and manage treasury disbursements — all governed by on-chain smart contracts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Cardano SDK | MeshSDK (`@meshsdk/core`, `@meshsdk/react`) |
| Chain Queries | Blockfrost API |
| Photo Storage | Cloudflare R2 (S3-compatible) |
| Video Storage | Cloudflare Stream |
| Database | Cloudflare D1 (SQLite) |
| Content Moderation | Cloudflare Workers AI |
| State Management | Zustand |
| Forms | React Hook Form + Zod validation |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local
# Fill in all values (see "Environment Setup" below)

# 3. Run database migrations (see "Cloudflare D1 Setup" below)
npm run d1:migrate

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                     # Authenticated app pages
│   │   ├── submit/page.tsx        # Trip proposal submission
│   │   ├── vote/page.tsx          # Proposal voting dashboard
│   │   └── trips/                 # Trip browsing & details
│   ├── (marketing)/               # Public marketing pages
│   │   ├── benefits/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── membership/page.tsx
│   │   └── resources/page.tsx
│   ├── api/
│   │   ├── proposals/             # Proposal CRUD + voting API
│   │   │   ├── route.ts           # GET (list) / POST (create)
│   │   │   └── vote/route.ts      # POST vote
│   │   └── media/                 # Media upload pipeline
│   │       ├── photo/             # R2 presign, upload, confirm
│   │       └── video/             # Stream create, upload, confirm
│   ├── layout.tsx                 # Root layout + WalletProvider
│   └── page.tsx                   # Landing page
│
├── components/
│   ├── wallet/                    # Wallet connect, NFT gate, selector
│   ├── submit/                    # Photo/video uploaders
│   ├── voting/                    # Vote panel, proposal actions
│   ├── layout/                    # Navbar, Footer
│   ├── trips/                     # Trip cards, carousel
│   └── ui/                        # shadcn/ui primitives
│
├── hooks/
│   ├── useCreateProposal.ts       # Build + submit proposal tx
│   ├── useCastVote.ts             # Build + submit vote tx
│   ├── useCancelVote.ts           # Revoke a vote
│   ├── useCountVotes.ts           # Tally votes on-chain
│   ├── useTreasuryDisburse.ts     # Disburse treasury funds
│   ├── useMediaUpload.ts          # Photo/video upload orchestration
│   ├── useProposals.ts            # Fetch proposals from D1
│   ├── useTripHuntWallet.ts       # Wallet state + NFT checking
│   ├── useWalletStore.ts          # Zustand wallet store
│   └── useVoteStore.ts            # Zustand vote store
│
├── lib/
│   ├── cardano/
│   │   ├── constants.ts           # Policy IDs, network config, currencies
│   │   ├── provider.ts            # Blockfrost provider (singleton)
│   │   ├── scripts.ts             # Load Plutus scripts, derive addresses
│   │   ├── types.ts               # Datum builders, redeemers, helpers
│   │   ├── wallet-utils.ts        # CIP-30 wallet helpers
│   │   ├── queries/               # Chain query functions
│   │   ├── scripts/               # Plutus V2 contract JSON envelopes
│   │   └── transactions/          # Transaction builders
│   │       ├── create-proposal.ts
│   │       ├── cast-vote.ts
│   │       ├── cancel-vote.ts
│   │       ├── count-votes.ts
│   │       └── disburse-treasury.ts
│   ├── cloudflare/
│   │   ├── r2.ts                  # R2 client (S3-compatible)
│   │   ├── stream.ts              # Cloudflare Stream API client
│   │   ├── d1.ts                  # D1 database queries
│   │   └── workers-ai.ts          # Content moderation via AI
│   └── utils.ts                   # General utilities
│
├── data/                          # Mock data for marketing pages
└── types/                         # Shared TypeScript types
```

---

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

### Cardano

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CARDANO_NETWORK` | `preprod` or `mainnet` |
| `NEXT_PUBLIC_BLOCKFROST_API_KEY` | Your Blockfrost project API key. Get one at [blockfrost.io](https://blockfrost.io). The key prefix (`preprodXXX...` or `mainnetXXX...`) must match the network. |
| `NEXT_PUBLIC_PLATFORM_FEE_PERCENT` | Fee percentage per trip submission (default: `3`) |
| `NEXT_PUBLIC_PLATFORM_FEE_ADDRESS` | Cardano address to receive platform fees |

### Cloudflare

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (Dashboard > Overview > right sidebar) |
| `CLOUDFLARE_API_TOKEN` | API token with R2, Stream, D1, and Workers AI permissions |
| `R2_ACCESS_KEY_ID` | R2 access key (Dashboard > R2 > Manage R2 API Tokens) |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name (default: `triphunt-media`) |
| `R2_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public URL for your R2 bucket (requires a custom domain or public bucket) |
| `D1_DATABASE_ID` | Your D1 database ID |

---

## Cloudflare Setup Guide

The application uses Cloudflare's developer platform for media storage, video streaming, database, and content moderation. All services are managed from the Cloudflare Dashboard.

### 1. Cloudflare R2 (Photo Storage)

R2 is an S3-compatible object store for photos.

1. Go to **Cloudflare Dashboard > R2**
2. Click **Create Bucket** — name it `triphunt-media`
3. Under **Settings > CORS Policy**, add the following (also included as `r2-cors.json` in this repo):
   ```json
   {
     "rules": [
       {
         "allowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
         "allowedMethods": ["GET", "PUT", "POST", "HEAD"],
         "allowedHeaders": ["*"],
         "exposeHeaders": ["ETag"],
         "maxAgeSeconds": 3600
       }
     ]
   }
   ```
4. For public read access, either:
   - Enable **Public Access** on the bucket and note the public URL, OR
   - Set up a **Custom Domain** under R2 > Bucket > Settings
5. Go to **R2 > Manage R2 API Tokens** to create access keys
6. Fill in `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, and `NEXT_PUBLIC_R2_PUBLIC_URL`

### 2. Cloudflare Stream (Video Storage)

Stream handles video upload, encoding, and playback.

1. Go to **Cloudflare Dashboard > Stream**
2. Stream is enabled at the account level — no bucket creation needed
3. The app uses the Stream API directly via `CLOUDFLARE_API_TOKEN`
4. Ensure your API token has **Stream:Edit** permissions

### 3. Cloudflare D1 (Database)

D1 is a serverless SQLite database for proposals, votes, and media metadata.

1. Go to **Cloudflare Dashboard > D1**
2. Click **Create Database** — name it `triphut-db`
3. Note the **Database ID** and add it to `D1_DATABASE_ID`
4. Run the migrations:
   ```bash
   # Install wrangler if needed
   npm install -g wrangler

   # Authenticate
   wrangler login

   # Run all migrations
   wrangler d1 execute triphut-db --file=./migrations/001_create_proposal_media.sql
   wrangler d1 execute triphut-db --file=./migrations/002_create_proposals.sql
   wrangler d1 execute triphut-db --file=./migrations/003_create_proposal_votes.sql
   ```
   Or use the npm script: `npm run d1:migrate`

### 4. Cloudflare Workers AI (Content Moderation)

Workers AI is used to automatically moderate uploaded photos for inappropriate content.

1. Workers AI is enabled at the account level — no setup needed
2. Ensure your `CLOUDFLARE_API_TOKEN` has **Workers AI** permissions
3. The moderation runs server-side during photo upload confirmation (`src/app/api/media/photo/confirm/route.ts`)

### API Token Permissions Summary

Create a single API token at **Cloudflare Dashboard > My Profile > API Tokens** with:
- **Account > R2 > Edit**
- **Account > Stream > Edit**
- **Account > D1 > Edit**
- **Account > Workers AI > Read** (or Edit)

---

## Connecting Off-Chain Code (Transaction Builders)

The frontend includes **pre-built transaction builders** in `src/lib/cardano/transactions/` that construct and submit Cardano transactions via MeshSDK + Blockfrost. These are the bridge between the UI and the on-chain DAO smart contracts.

### How It Works

```
User Action (UI)
    ↓
React Hook (src/hooks/useCreateProposal.ts, etc.)
    ↓
Transaction Builder (src/lib/cardano/transactions/create-proposal.ts, etc.)
    ↓
MeshSDK TxBuilder → Blockfrost (submit)
    ↓
On-chain Plutus V2 Smart Contracts
```

### Script Loading

The Plutus V2 smart contract scripts (compiled UPLC bytecode) live in `src/lib/cardano/scripts/` as JSON files in cardano-cli envelope format:

```json
{
  "type": "PlutusScriptV2",
  "description": "",
  "cborHex": "59XXXX..."
}
```

The file `src/lib/cardano/scripts.ts` loads these scripts, converts them to MeshSDK `PlutusScript` objects, and derives:
- **Policy IDs** (from minting scripts) — via `resolveScriptHash()`
- **Validator addresses** (from spending scripts) — via `serializePlutusScript()`

### Applying Parameters to Scripts

**Important**: The scripts in `src/lib/cardano/scripts/` are the **unapplied** (parameterized) Plutus V2 scripts compiled from the [DAO repository](https://github.com/yaadlabs/DAO). Before using them on-chain, each script needs its parameters applied.

If you have already deployed the DAO (i.e., you have applied scripts from a bootstrap process), replace the JSON files in `src/lib/cardano/scripts/` with the **applied** versions. The applied scripts have all parameters baked in and are ready for on-chain use.

If you need to deploy fresh:
1. Use the bootstrap tooling from the [DAO repository](https://github.com/yaadlabs/DAO) to apply parameters and deploy
2. The bootstrap process will produce applied script files — copy them into `src/lib/cardano/scripts/`
3. The `scripts.ts` loader will automatically pick them up

### Transaction Builders

Each file in `src/lib/cardano/transactions/` builds one type of DAO transaction:

| File | Action | Description |
|------|--------|-------------|
| `create-proposal.ts` | Submit a trip proposal | Spends Index UTxO, mints Tally NFT, creates Tally UTxO with trip details |
| `cast-vote.ts` | Vote on a proposal | Mints a Vote NFT, creates Vote UTxO at the vote validator |
| `cancel-vote.ts` | Revoke a vote | Burns the Vote NFT and spends the Vote UTxO |
| `count-votes.ts` | Tally votes | Counts all Vote UTxOs for a proposal and updates the Tally UTxO |
| `disburse-treasury.ts` | Disburse funds | Spends Treasury UTxO to pay the travel agent and traveler |

### Adding Your Own Off-Chain Logic

If you need to modify or extend the transaction builders:

1. **Scripts**: Add/replace JSON files in `src/lib/cardano/scripts/` and update `scripts.ts`
2. **Datums & Redeemers**: Edit `src/lib/cardano/types.ts` — this file contains all datum constructors (`buildTallyStateDatum`, `buildIndexDatum`, etc.) and redeemer constants
3. **Queries**: Add chain query functions in `src/lib/cardano/queries/`
4. **New Transactions**: Create a new file in `src/lib/cardano/transactions/`, then create a corresponding React hook in `src/hooks/`

### Key Constants

In `src/lib/cardano/constants.ts`:
- `MEMBERSHIP_POLICY_ID` — The NFT policy ID used for token-gating access
- `NETWORK` — Determined by `NEXT_PUBLIC_CARDANO_NETWORK`
- `SUPPORTED_CURRENCIES` — ADA, USDM, USDCx with their policy IDs
- `PLATFORM_FEE_PERCENT` / `PLATFORM_FEE_ADDRESS` — Fee configuration

Update `MEMBERSHIP_POLICY_ID` to match your membership NFT's policy ID.

---

## Wallet Integration

The app uses MeshSDK's CIP-30 wallet connector supporting:
- **Nami**
- **Eternl**
- **Flint**
- **Lace**
- **Typhon**
- **GeroWallet**
- And any other CIP-30 compatible browser wallet

The wallet flow:
1. User clicks "Connect Wallet" → `WalletSelectDialog` shows available wallets
2. On connect, the app checks for a membership NFT (policy ID in `constants.ts`)
3. If the user holds the NFT, they gain access to submit proposals and vote
4. If not, the `NFTGate` component shows a membership prompt

---

## Database Schema

Three D1 tables (migrations in `migrations/`):

### `proposal_media` — Media attachments
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| proposal_id | TEXT | Links to proposal |
| wallet_addr | TEXT | Uploader's wallet |
| media_type | TEXT | `photo` or `video` |
| r2_key | TEXT | R2 object key (photos) |
| stream_uid | TEXT | Stream UID (videos) |
| status | TEXT | `pending`, `approved`, `rejected` |
| sort_order | INTEGER | Display ordering |

### `proposals` — Trip proposals
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| wallet_address | TEXT | Submitter's wallet |
| destination | TEXT | Trip destination |
| departure_date | TEXT | ISO date |
| return_date | TEXT | ISO date |
| description | TEXT | Proposal description |
| amount | REAL | Trip cost |
| currency | TEXT | ADA, USDM, or USDCx |
| media_urls | TEXT | JSON array of media URLs |
| status | TEXT | `pending`, `approved`, etc. |
| tx_hash | TEXT | On-chain transaction hash |

### `proposal_votes` — Vote records
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| proposal_id | TEXT | Links to proposal |
| wallet_address | TEXT | Voter's wallet |
| direction | TEXT | `for` or `against` |

---

## Deployment (Cloudflare Pages)

This application is designed to run entirely on the Cloudflare platform — Pages hosts the site, R2 stores photos, Stream handles video, D1 provides the database, and Workers AI moderates content. Keeping everything on Cloudflare gives you the best performance, simplest configuration, and direct access to all service bindings.

### Setup

1. Go to **Cloudflare Dashboard > Workers & Pages > Create**
2. Select **Connect to Git** and link this repository
3. Configure the build:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
4. Add all environment variables from `.env.example` under **Settings > Environment Variables**
5. Bind your D1 database under **Settings > Bindings**:
   - Variable name: `DB`
   - D1 database: `triphut-db`
6. Deploy

### Custom Domain

1. Go to **Pages > your project > Custom Domains**
2. Add your domain (e.g., `app.triphunt.io`)
3. Cloudflare handles SSL automatically

### Preview Deployments

Cloudflare Pages automatically creates preview deployments for every push to non-production branches, which is useful for staging and QA.

---

## License

Proprietary — built by Yaad Labs for TripHunt DAO.
