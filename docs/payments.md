# Quad Payments - Design Document

## Overview

This document describes the payments foundation for Quad, a campus marketplace targeting South African universities. The goal is to enable secure peer-to-peer transactions between students (buyers and sellers) with the platform facilitating but not holding funds.

## Payment Provider Choice: Paystack

**Selected Provider:** [Paystack](https://paystack.com/)

### Why Paystack for South Africa?

1. **Native ZAR Support** - No currency conversion fees. Transactions stay in South African Rand.

2. **Popular in SA** - Widely adopted by SA fintechs, students are familiar with it.

3. **Multiple Payment Methods**:
   - Card payments (Visa, Mastercard)
   - Instant EFT (Ozow integration)
   - Mobile money (future)

4. **Lower Fees for Local Transactions**:
   - Local cards: 2.9% + R2.00
   - International cards: 3.9% + R2.00
   - Compared to Stripe which adds FX conversion overhead

5. **Student-Friendly** - Mobile-first checkout, supports popular SA banking apps.

6. **React Native SDK** - Official `react-native-paystack-webview` package.

### Alternatives Considered

| Provider | Pros | Cons |
|----------|------|------|
| **Yoco** | SA company, POS integration | More retail-focused, limited marketplace features |
| **Stripe** | Global, great docs | FX fees for ZAR, not optimized for SA |
| **Peach Payments** | Local, good coverage | Higher fees, less developer tooling |

## Payment Flow Architecture

### Phase 1: Foundation (Current)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Buyer     │────▶│    Quad     │────▶│   Seller    │
│  (Student)  │     │  (Platform) │     │  (Student)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │
      │   Initiates        │   Records payment
      │   payment          │   in DB (status: pending)
      │                    │
      ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                    Paystack                          │
│   - Processes card/EFT                              │
│   - Holds funds during transaction                   │
│   - Sends webhook on success/failure                 │
└─────────────────────────────────────────────────────┘
```

### Who Pays Whom?

**Buyer → Seller (via Paystack)**

- Buyer pays for the listing item
- Paystack processes the payment
- Seller receives payout (minus Paystack fees)
- Quad does NOT hold funds (not an escrow)

### Platform Fees (Future)

In a future phase, Quad may introduce a small platform fee:
- Example: 2.5% platform fee on top of Paystack fees
- Would be split at checkout: Seller receives (amount - platform_fee - paystack_fees)

**Note:** Platform fees are OUT OF SCOPE for this foundation. The current implementation records transactions for audit purposes only.

### Escrow (Future - Out of Scope)

True escrow functionality requires:
- Holding funds until delivery confirmation
- Dispute resolution process
- Additional regulatory compliance (FSCA in SA)

**This is intentionally OUT OF SCOPE.** Phase 1 is direct buyer-to-seller via Paystack.

## Database Schema

### `payments` Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  payer_id UUID NOT NULL REFERENCES profiles(id),
  payee_id UUID NOT NULL REFERENCES profiles(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_ref TEXT,           -- Paystack transaction reference
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,              -- Additional provider data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Payment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated, awaiting completion |
| `processing` | Payment in progress with provider |
| `completed` | Payment successful, funds transferred |
| `failed` | Payment failed or declined |
| `refunded` | Payment was refunded |
| `cancelled` | Payment cancelled by user |

## Environment Variables

### Client-side (Expo app)

```bash
# Paystack Configuration
# Get keys from: https://dashboard.paystack.com/#/settings/developers
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx  # Public key (safe for client)

# Feature flags
EXPO_PUBLIC_PAYMENTS_ENABLED=false           # Set to true to enable payments UI
```

### Server-side (Supabase Edge Functions)

The `PAYSTACK_SECRET_KEY` must be set as a Supabase Edge Function secret:

```bash
# Set the secret key for Edge Functions
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx
```

**Security Notes:**
- NEVER commit secret keys to git
- Public key can be exposed in client (prefixed with `pk_`)
- Secret key must only be used server-side (Edge Functions)
- Use test keys (`pk_test_`, `sk_test_`) for development

## Supabase Edge Functions

### paystack-initialize

Initializes a Paystack transaction and returns the authorization URL.

**Deployment:**
```bash
supabase functions deploy paystack-initialize
```

**Usage:**
```
POST /functions/v1/paystack-initialize
Headers: Authorization: Bearer <supabase-anon-key>
Body: {
  "paymentId": "uuid-of-payment-record",
  "email": "buyer@example.com",
  "amountCents": 15000
}
```

### paystack-verify

Verifies a Paystack transaction and updates the payment record. Also handles webhooks.

**Deployment:**
```bash
supabase functions deploy paystack-verify
```

**Usage (Client verification):**
```
POST /functions/v1/paystack-verify
Headers: Authorization: Bearer <supabase-anon-key>
Body: { "reference": "QUAD_xxx" }
```

**Usage (Webhook):**
Set the webhook URL in Paystack Dashboard to:
`https://<project-ref>.supabase.co/functions/v1/paystack-verify`

## Implementation Phases

### Phase 1: Foundation (Completed - PR #8)
- [x] Design document
- [x] Database migration (`payments` table)
- [x] Environment variable placeholders
- [x] UI stub: "Pay with Paystack" button (gated)
- [x] Checkout placeholder screen

### Phase 2: Basic Payments (Current)
- [x] Paystack SDK integration (`react-native-paystack-webview`)
- [x] Server-side Edge Functions (`paystack-initialize`, `paystack-verify`)
- [x] Webhook handler (signature verification in `paystack-verify`)
- [x] Payment verification flow (server-side verification after success)
- [x] Success/failure/cancelled screens with clear UI
- [ ] Payment history in profile (future enhancement)

### Phase 3: Enhanced Features (Future)
- [ ] Platform fees
- [ ] Refund flow
- [ ] Dispute handling
- [ ] Payout scheduling for sellers

### Phase 4: Escrow (Future - Requires Legal Review)
- [ ] Hold funds until delivery
- [ ] Buyer confirmation flow
- [ ] Automatic release after N days
- [ ] Dispute resolution

## Testing Strategy

### Test Mode

Paystack provides test credentials for development:
- Test cards: `4084084084084081` (success), `4000000000000002` (decline)
- Test bank: Any valid SA bank account number
- No real money moves in test mode

### Environment Gating

The "Pay" button is only shown when:
1. `EXPO_PUBLIC_PAYMENTS_ENABLED=true`
2. `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
3. User is authenticated
4. User is not the listing seller

## Security Considerations

1. **No Secret Keys in Client** - Only public keys are used in the React Native app
2. **Webhook Verification** - All Paystack webhooks must verify signature (Phase 2)
3. **Amount Validation** - Backend must verify amount matches listing price
4. **Idempotency** - Use `provider_ref` to prevent duplicate charges
5. **Audit Trail** - All payment attempts logged in database

## References

- [Paystack Documentation](https://paystack.com/docs/)
- [Paystack React Native](https://github.com/just1and0/react-native-paystack-webview)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments)
- [SA Payment Regulations (FSCA)](https://www.fsca.co.za/)
