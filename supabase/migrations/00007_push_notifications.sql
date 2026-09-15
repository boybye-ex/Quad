-- Quad Step 5: Push Notifications Foundation
-- Add expo_push_token to profiles for push notification delivery

-- =============================================================================
-- ADD EXPO PUSH TOKEN COLUMN TO PROFILES
-- =============================================================================

-- Nullable column to store the Expo push token for each user.
-- The token is obtained when the user grants notification permissions
-- and is used by the Expo Push API to deliver notifications.
ALTER TABLE profiles
ADD COLUMN expo_push_token TEXT;

-- Index for efficient lookup when sending notifications
-- (e.g., find all users with tokens for bulk notifications)
CREATE INDEX idx_profiles_expo_push_token ON profiles(expo_push_token)
WHERE expo_push_token IS NOT NULL;

COMMENT ON COLUMN profiles.expo_push_token IS 'Expo push token for sending push notifications. Obtained after user grants permission. Format: ExponentPushToken[xxxxx]';

-- =============================================================================
-- UPDATE PROFILE POLICY TO ALLOW USERS TO UPDATE THEIR OWN PUSH TOKEN
-- =============================================================================

-- The existing "Users can update own profile fields" policy already allows
-- users to update their own profile. The expo_push_token column will be
-- covered by this policy since it allows updates where id = auth.uid().
-- No additional policy changes needed.

-- =============================================================================
-- HELPER FUNCTION: Get users with push tokens for a conversation
-- =============================================================================

-- Returns the expo_push_token for the other participant in a conversation.
-- Used when sending "new message" notifications.
CREATE OR REPLACE FUNCTION get_conversation_recipient_push_token(
  p_conversation_id UUID,
  p_sender_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_recipient_token TEXT;
BEGIN
  SELECT p.expo_push_token INTO v_recipient_token
  FROM conversations c
  JOIN profiles p ON (
    CASE
      WHEN c.participant_1_id = p_sender_id THEN c.participant_2_id
      ELSE c.participant_1_id
    END = p.id
  )
  WHERE c.id = p_conversation_id
    AND p.expo_push_token IS NOT NULL
    AND p.is_suspended = FALSE;
  
  RETURN v_recipient_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_conversation_recipient_push_token IS 'Returns the Expo push token of the other participant in a conversation, for sending new message notifications. Returns NULL if recipient has no token or is suspended.';
