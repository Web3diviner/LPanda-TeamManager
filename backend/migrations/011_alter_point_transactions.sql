-- Migration 011: Remove point_transactions reason constraint
-- Requirements: Allow any valid reason text for point transactions

ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_reason_check;
