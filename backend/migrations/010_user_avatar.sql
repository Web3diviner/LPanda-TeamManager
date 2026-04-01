-- Migration 010: Add avatar_url to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
