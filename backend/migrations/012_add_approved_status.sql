-- Migration 012: Add 'approved' status to delegated_tasks
-- Requirements: Allow tracking approved tasks separately from completed

ALTER TABLE delegated_tasks DROP CONSTRAINT IF EXISTS delegated_tasks_status_check;

ALTER TABLE delegated_tasks ADD CONSTRAINT delegated_tasks_status_check
  CHECK (status IN ('assigned', 'completed', 'approved', 'missed'));
