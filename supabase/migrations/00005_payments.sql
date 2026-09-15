-- Quad Step 5: Payments Foundation
-- Database schema for payment tracking (ZAR, South Africa)

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Amount in cents (e.g., R150.00 = 15000 cents)
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  
  -- Payment provider info
  provider TEXT NOT NULL DEFAULT 'paystack' CHECK (provider IN ('paystack', 'yoco', 'stripe')),
  provider_ref TEXT,  -- Provider's transaction reference (e.g., Paystack txn ID)
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Payment initiated, not yet processed
    'processing',  -- Payment in progress with provider
    'completed',   -- Payment successful
    'failed',      -- Payment failed or declined
    'refunded',    -- Payment was refunded
    'cancelled'    -- Payment cancelled by user
  )),
  
  -- Additional metadata (provider response, fees, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_payments_listing ON payments(listing_id);
CREATE INDEX idx_payments_payer ON payments(payer_id);
CREATE INDEX idx_payments_payee ON payments(payee_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_ref ON payments(provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX idx_payments_created ON payments(created_at DESC);

COMMENT ON TABLE payments IS 'Payment records for listing transactions (ZAR, South Africa)';
COMMENT ON COLUMN payments.amount_cents IS 'Payment amount in cents (ZAR). R150.00 = 15000';
COMMENT ON COLUMN payments.provider_ref IS 'External reference from payment provider (Paystack txn ID)';
COMMENT ON COLUMN payments.metadata IS 'Additional provider data: fees, card type, bank, etc.';

-- =============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY FOR PAYMENTS
-- =============================================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments they're involved in (as payer or payee)
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (payer_id = auth.uid() OR payee_id = auth.uid());

-- Users can create payments where they are the payer
CREATE POLICY "Users can create payments as payer"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    payer_id = auth.uid() AND
    payer_id != payee_id AND  -- Cannot pay yourself
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
    )
  );

-- Payments can only be updated by system (via service role) or admin
-- Regular users cannot modify payment records directly
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Create a new payment record (called when user initiates checkout)
CREATE OR REPLACE FUNCTION create_payment(
  p_listing_id UUID,
  p_amount_cents INTEGER,
  p_provider TEXT DEFAULT 'paystack'
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_payee_id UUID;
  v_listing_price INTEGER;
BEGIN
  -- Get listing details and verify it exists and is active
  SELECT seller_id, (price * 100)::INTEGER INTO v_payee_id, v_listing_price
  FROM listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_payee_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found or not active';
  END IF;

  -- Cannot pay for your own listing
  IF v_payee_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot pay for your own listing';
  END IF;

  -- Verify amount matches listing price (prevent manipulation)
  IF p_amount_cents != v_listing_price THEN
    RAISE EXCEPTION 'Amount does not match listing price';
  END IF;

  -- Check if user is verified and not suspended
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
  ) THEN
    RAISE EXCEPTION 'Only verified users can make payments';
  END IF;

  -- Create payment record
  INSERT INTO payments (listing_id, payer_id, payee_id, amount_cents, provider)
  VALUES (p_listing_id, auth.uid(), v_payee_id, p_amount_cents, p_provider)
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update payment status (would be called by webhook handler in production)
-- This is a server-side only function (requires service role)
CREATE OR REPLACE FUNCTION update_payment_status(
  p_payment_id UUID,
  p_status TEXT,
  p_provider_ref TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE payments
  SET 
    status = p_status,
    provider_ref = COALESCE(p_provider_ref, provider_ref),
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get payment history for a user (as payer or payee)
CREATE OR REPLACE FUNCTION get_user_payments(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  listing_id UUID,
  listing_title TEXT,
  payer_id UUID,
  payer_name TEXT,
  payee_id UUID,
  payee_name TEXT,
  amount_cents INTEGER,
  currency TEXT,
  provider TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.listing_id,
    l.title AS listing_title,
    p.payer_id,
    payer.name AS payer_name,
    p.payee_id,
    payee.name AS payee_name,
    p.amount_cents,
    p.currency,
    p.provider,
    p.status,
    p.created_at
  FROM payments p
  JOIN listings l ON p.listing_id = l.id
  JOIN profiles payer ON p.payer_id = payer.id
  JOIN profiles payee ON p.payee_id = payee.id
  WHERE p.payer_id = auth.uid() OR p.payee_id = auth.uid()
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get payment stats for admin dashboard
CREATE OR REPLACE FUNCTION get_payment_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  SELECT json_build_object(
    'total_payments', (SELECT COUNT(*) FROM payments),
    'completed_payments', (SELECT COUNT(*) FROM payments WHERE status = 'completed'),
    'pending_payments', (SELECT COUNT(*) FROM payments WHERE status = 'pending'),
    'failed_payments', (SELECT COUNT(*) FROM payments WHERE status = 'failed'),
    'total_volume_cents', (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE status = 'completed'),
    'payments_today', (SELECT COUNT(*) FROM payments WHERE created_at >= CURRENT_DATE),
    'volume_today_cents', (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE)
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
