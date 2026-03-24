-- Migration 006: Delegated tasks, notifications, feedback

-- Admin-created tasks delegated directly to a user
CREATE TABLE IF NOT EXISTS delegated_tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  assigned_to  UUID REFERENCES users(id) NOT NULL,
  created_by   UUID REFERENCES users(id) NOT NULL,
  deadline     TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','completed','missed')),
  admin_remark TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- In-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback from users (optional), admin can add remarks
CREATE TABLE IF NOT EXISTS feedback (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) NOT NULL,
  message      TEXT NOT NULL,
  admin_remark TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
