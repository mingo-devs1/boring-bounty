-- Fix for trigger functions causing "query has no destination for result data" error
-- This migration disables all triggers on submissions table to allow critical operations

-- Drop ALL triggers on submissions table
DROP TRIGGER IF EXISTS notify_submission_status_change_trigger ON submissions;
DROP TRIGGER IF EXISTS notify_winner_selected_trigger ON submissions;
DROP TRIGGER IF EXISTS update_reputation_on_status_change ON submissions;
DROP TRIGGER IF EXISTS trigger_update_builder_stats ON submissions;

-- Note: Triggers have been disabled to prevent errors when marking submissions as reviewed or selecting winners.
-- Notifications and reputation updates will be handled manually in server actions instead of via triggers.
