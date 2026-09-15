// =============================================================================
// SUPABASE EDGE FUNCTION: paystack-initialize
// =============================================================================
// Initializes a Paystack transaction and returns the authorization URL.
// The client opens this URL in a WebView to complete payment.
//
// DEPLOYMENT STEPS:
// 1. Set the PAYSTACK_SECRET_KEY secret:
//    supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your-secret-key
// 2. Deploy the function:
//    supabase functions deploy paystack-initialize
//
// USAGE:
// POST /functions/v1/paystack-initialize
// Headers: Authorization: Bearer <supabase-anon-key>
// Body: {
//   "paymentId": "uuid-of-payment-record",
//   "email": "buyer@example.com",
//   "amountCents": 15000,
//   "callbackUrl": "quadapp://payment-callback"
// }
//
// RESPONSE:
// {
//   "success": true,
//   "authorizationUrl": "https://checkout.paystack.com/xxx",
//   "accessCode": "xxx",
//   "reference": "QUAD_xxx"
// }
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const PAYSTACK_API_URL = 'https://api.paystack.co';

interface InitializeRequest {
  paymentId: string;
  email: string;
  amountCents: number;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get Paystack secret key
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('[paystack-initialize] PAYSTACK_SECRET_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for updating payment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: InitializeRequest = await req.json();
    const { paymentId, email, amountCents, callbackUrl, metadata } = body;

    // Validate required fields
    if (!paymentId || !email || !amountCents) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: paymentId, email, amountCents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount is positive
    if (amountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be positive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment exists and is in pending status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status, amount_cents, listing_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('[paystack-initialize] Payment not found:', paymentId);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Payment already ${payment.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount matches
    if (payment.amount_cents !== amountCents) {
      console.error('[paystack-initialize] Amount mismatch:', { expected: payment.amount_cents, received: amountCents });
      return new Response(
        JSON.stringify({ error: 'Amount does not match payment record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `QUAD_${paymentId.replace(/-/g, '').substring(0, 12)}_${Date.now()}`;

    // Build Paystack initialize payload
    const paystackPayload = {
      email,
      amount: amountCents, // Paystack expects amount in kobo/cents
      currency: 'ZAR',
      reference,
      callback_url: callbackUrl,
      metadata: {
        payment_id: paymentId,
        listing_id: payment.listing_id,
        ...metadata,
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'eft'],
    };

    // Call Paystack Initialize API
    const paystackResponse = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData: PaystackInitializeResponse = await paystackResponse.json();

    if (!paystackData.status || !paystackData.data) {
      console.error('[paystack-initialize] Paystack error:', paystackData.message);
      return new Response(
        JSON.stringify({ error: paystackData.message || 'Failed to initialize payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record with reference and set status to processing
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        provider_ref: reference,
        status: 'processing',
        metadata: {
          access_code: paystackData.data.access_code,
          initialized_at: new Date().toISOString(),
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('[paystack-initialize] Failed to update payment:', updateError);
      // Continue anyway - payment can still be verified later
    }

    console.log('[paystack-initialize] Transaction initialized:', reference);

    return new Response(
      JSON.stringify({
        success: true,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[paystack-initialize] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
