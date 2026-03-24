-- Migration 008: Add role_title to users (custom display title set by admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_title TEXT;
