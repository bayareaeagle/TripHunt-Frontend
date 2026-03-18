-- Cloudflare D1 migration: proposal_media table
-- Run via: wrangler d1 execute triphut-db --file=./migrations/001_create_proposal_media.sql
-- Or via Cloudflare dashboard: D1 > triphut-db > Console > paste & run

CREATE TABLE IF NOT EXISTS proposal_media (
  id          TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  wallet_addr TEXT NOT NULL,
  media_type  TEXT NOT NULL CHECK(media_type IN ('photo','video')),
  r2_key      TEXT,
  stream_uid  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proposal_media_proposal ON proposal_media(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_media_wallet ON proposal_media(wallet_addr);
