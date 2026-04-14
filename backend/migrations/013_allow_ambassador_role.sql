-- Migration 013: Allow ambassador user role

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'member', 'ambassador'));
