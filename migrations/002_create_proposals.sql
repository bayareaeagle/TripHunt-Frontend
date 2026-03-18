-- Cloudflare D1 migration: proposals table (off-chain storage for preprod testing)
-- Run via: wrangler d1 execute triphut-db --file=./migrations/002_create_proposals.sql
-- Or via Cloudflare dashboard: D1 > triphut-db > Console > paste & run

CREATE TABLE IF NOT EXISTS proposals (
  id              TEXT PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  destination     TEXT NOT NULL,
  departure_date  TEXT NOT NULL,
  return_date     TEXT NOT NULL,
  description     TEXT NOT NULL,
  amount          REAL NOT NULL,
  currency        TEXT NOT NULL,
  media_urls      TEXT NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  tx_hash         TEXT
);

CREATE INDEX IF NOT EXISTS idx_proposals_wallet ON proposals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at);
