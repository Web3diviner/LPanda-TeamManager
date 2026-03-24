-- Migration 002: Create tasks table
-- Requirements: 2.1, 4.1

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description   TEXT NOT NULL,
  submitted_by  UUID REFERENCES users(id),
  assigned_to   UUID REFERENCES users(id),
  deadline      TIMESTAMPTZ,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'completed', 'missed')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
