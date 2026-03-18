-- Cloudflare D1 migration: proposal_votes table + vote count columns
-- Run via: Cloudflare dashboard D1 console or wrangler d1 execute

CREATE TABLE IF NOT EXISTS proposal_votes (
  id              TEXT PRIMARY KEY,
  proposal_id     TEXT NOT NULL,
  wallet_address  TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK(direction IN ('for','against')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON proposal_votes(proposal_id, wallet_address);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON proposal_votes(proposal_id);

-- Add cached vote counts to proposals table (if not already present)
-- ALTER TABLE proposals ADD COLUMN votes_for INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE proposals ADD COLUMN votes_against INTEGER NOT NULL DEFAULT 0;
