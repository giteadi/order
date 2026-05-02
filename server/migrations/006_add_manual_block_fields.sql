-- Add manual block fields to user_subscriptions
-- These fields allow super admin to manually block/unblock subscriptions

ALTER TABLE user_subscriptions ADD COLUMN is_manually_blocked INTEGER DEFAULT 0;
ALTER TABLE user_subscriptions ADD COLUMN block_reason TEXT;
ALTER TABLE user_subscriptions ADD COLUMN blocked_at DATETIME;
ALTER TABLE user_subscriptions ADD COLUMN blocked_by INTEGER;

-- Add index for faster lookup of blocked subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_blocked ON user_subscriptions(is_manually_blocked);

-- Add foreign key constraint for blocked_by
-- Note: SQLite doesn't support ALTER TABLE ADD FOREIGN KEY
-- The application layer will handle referential integrity
