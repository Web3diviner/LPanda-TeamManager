-- Migration 015: Add ambassador_admin role
-- Purpose: Create a new admin role for managing only ambassadors

ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'member', 'ambassador', 'ambassador_admin'));
