-- Quad Step 3: Real Chat
-- Conversations and messages with realtime support

-- =============================================================================
-- DROP STUB MESSAGES TABLE AND CREATE REAL SCHEMA
-- =============================================================================
DROP TABLE IF EXISTS messages;

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id, listing_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

COMMENT ON TABLE conversations IS 'Chat conversations between two users, optionally linked to a listing';
COMMENT ON COLUMN conversations.last_message_id IS 'Denormalized for quick inbox display';
COMMENT ON COLUMN conversations.last_message_at IS 'Denormalized for sorting inbox by recent activity';

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE messages IS 'Chat messages within conversations';

-- Add foreign key for last_message_id after messages table exists
ALTER TABLE conversations 
  ADD CONSTRAINT fk_last_message 
  FOREIGN KEY (last_message_id) 
  REFERENCES messages(id) 
  ON DELETE SET NULL;

-- =============================================================================
-- TRIGGER: Update conversation on new message
-- =============================================================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- =============================================================================
-- TRIGGER: Update conversation timestamp on any change
-- =============================================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS: Participants can read their own conversations
CREATE POLICY "Participants can read own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    participant_1_id = auth.uid() OR 
    participant_2_id = auth.uid()
  );

-- CONVERSATIONS: Authenticated users can create conversations
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    (participant_1_id = auth.uid() OR participant_2_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
    )
  );

-- CONVERSATIONS: Participants can update their own conversations (for marking read, etc.)
CREATE POLICY "Participants can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    participant_1_id = auth.uid() OR 
    participant_2_id = auth.uid()
  )
  WITH CHECK (
    participant_1_id = auth.uid() OR 
    participant_2_id = auth.uid()
  );

-- MESSAGES: Participants can read messages in their conversations
CREATE POLICY "Participants can read conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- MESSAGES: Participants can send messages to their conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
    )
  );

-- MESSAGES: Users can update their own messages (for is_read by recipient)
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Find or create a conversation between two users for a listing
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id UUID,
  p_other_user_id UUID,
  p_listing_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (
    (participant_1_id = p_user_id AND participant_2_id = p_other_user_id) OR
    (participant_1_id = p_other_user_id AND participant_2_id = p_user_id)
  )
  AND (
    (p_listing_id IS NULL AND listing_id IS NULL) OR
    (listing_id = p_listing_id)
  )
  LIMIT 1;
  
  -- Create new conversation if not found
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id, listing_id)
    VALUES (p_user_id, p_other_user_id, p_listing_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM messages
  WHERE conversation_id = p_conversation_id
  AND sender_id != p_user_id
  AND is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all messages in a conversation as read for a user
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
  AND sender_id != p_user_id
  AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENABLE REALTIME
-- =============================================================================
-- Note: Enable realtime for messages table in Supabase Dashboard
-- Go to Database > Replication > Add table > messages
-- Or run:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

COMMENT ON TABLE messages IS 'Chat messages - Realtime enabled for live updates';
