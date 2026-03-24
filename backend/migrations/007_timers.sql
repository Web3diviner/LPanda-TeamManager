-- Migration 007: Global task timers set by admin
CREATE TABLE IF NOT EXISTS task_timers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label       TEXT NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  active      BOOLEAN NOT NULL DEFAULT true
);
