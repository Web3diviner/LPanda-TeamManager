-- Migration 005: Add screenshot_url and task_link to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_link TEXT;
