-- Migration 003: Create point_transactions table
-- Requirements: 5.1, 5.4

CREATE TABLE IF NOT EXISTS point_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  task_id     UUID REFERENCES tasks(id),
  delta       NUMERIC(10,2) NOT NULL,   -- +3.0 or -1.5
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
