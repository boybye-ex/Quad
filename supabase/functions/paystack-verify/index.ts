// =============================================================================
// SUPABASE EDGE FUNCTION: paystack-verify
// =============================================================================
// Verifies a Paystack transaction and updates the payment record.
// Called after checkout success to confirm payment server-side.
// Can also serve as a webhook handler for Paystack events.
//
// DEPLOYMENT STEPS:
// 1. Set the PAYSTACK_SECRET_KEY secret:
//    supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your-secret-key
// 2. Deploy the function:
//    supabase functions deploy paystack-verify
//
// USAGE (Client verification):
// POST /functions/v1/paystack-verify
// Headers: Authorization: Bearer <supabase-anon-key>
// Body: { "reference": "QUAD_xxx" }
//
// USAGE (Webhook - set this URL in Paystack Dashboard):
// POST /functions/v1/paystack-verify
// Headers: x-paystack-signature: <signature>
// Body: { "event": "charge.success", "data": {...} }
//
// RESPONSE:
// {
//   "success": true,
//   "status": "completed",
//   "paymentId": "uuid",
//   "amount": 15000
// }
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const PAYSTACK_API_URL = 'https://api.paystack.co';

interface VerifyRequest {
  reference: string;
}

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      payment_id?: string;
      listing_id?: string;
    };
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at?: string;
    channel?: string;
    metadata?: {
      payment_id?: string;
      listing_id?: string;
    };
    authorization?: {
      last4?: string;
      card_type?: string;
      bank?: string;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-paystack-signature',
};

function computeHmacSha512(data: string, secret: string): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const hmac = createHmac('sha512', keyData);
  hmac.update(messageData);
  
  const hashArray = Array.from(new Uint8Array(hmac.digest()));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
      console.error('[paystack-verify] PAYSTACK_SECRET_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a webhook request
    const paystackSignature = req.headers.get('x-paystack-signature');
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    let reference: string;

    if (paystackSignature) {
      // Webhook request - verify signature
      const expectedSignature = computeHmacSha512(bodyText, paystackSecretKey);
      
      if (paystackSignature !== expectedSignature) {
        console.error('[paystack-verify] Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const webhookEvent = body as PaystackWebhookEvent;
      console.log('[paystack-verify] Webhook event:', webhookEvent.event);

      // Only process successful charge events
      if (webhookEvent.event !== 'charge.success') {
        console.log('[paystack-verify] Ignoring event:', webhookEvent.event);
        return new Response(
          JSON.stringify({ success: true, message: 'Event ignored' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      reference = webhookEvent.data.reference;
    } else {
      // Client verification request
      const verifyRequest = body as VerifyRequest;
      
      if (!verifyRequest.reference) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: reference' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      reference = verifyRequest.reference;
    }

    // Verify transaction with Paystack API
    const verifyResponse = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData: PaystackVerifyResponse = await verifyResponse.json();

    if (!verifyData.status || !verifyData.data) {
      console.error('[paystack-verify] Verification failed:', verifyData.message);
      return new Response(
        JSON.stringify({ error: verifyData.message || 'Verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const txnData = verifyData.data;
    const paymentId = txnData.metadata?.payment_id;

    // Determine payment status
    let paymentStatus: string;
    switch (txnData.status) {
      case 'success':
        paymentStatus = 'completed';
        break;
      case 'failed':
      case 'abandoned':
        paymentStatus = 'failed';
        break;
      case 'pending':
        paymentStatus = 'processing';
        break;
      default:
        paymentStatus = 'failed';
    }

    // Find the payment record by reference or paymentId
    let paymentQuery = supabase.from('payments').select('id, status, amount_cents');
    
    if (paymentId) {
      paymentQuery = paymentQuery.eq('id', paymentId);
    } else {
      paymentQuery = paymentQuery.eq('provider_ref', reference);
    }

    const { data: payment, error: findError } = await paymentQuery.single();

    if (findError || !payment) {
      console.error('[paystack-verify] Payment not found for reference:', reference);
      return new Response(
        JSON.stringify({ error: 'Payment record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount matches (Paystack returns amount in cents/kobo)
    if (txnData.amount !== payment.amount_cents) {
      console.error('[paystack-verify] Amount mismatch:', {
        expected: payment.amount_cents,
        received: txnData.amount,
      });
      
      // Update payment as failed due to amount mismatch
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            error: 'Amount mismatch',
            paystack_amount: txnData.amount,
            expected_amount: payment.amount_cents,
            verified_at: new Date().toISOString(),
          },
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({ error: 'Payment amount verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip update if already in final state
    if (payment.status === 'completed' || payment.status === 'refunded') {
      console.log('[paystack-verify] Payment already in final state:', payment.status);
      return new Response(
        JSON.stringify({
          success: true,
          status: payment.status,
          paymentId: payment.id,
          amount: payment.amount_cents,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update payment record
    const updatePayload = {
      status: paymentStatus,
      provider_ref: reference,
      metadata: {
        paystack_status: txnData.status,
        paid_at: txnData.paid_at,
        channel: txnData.channel,
        card_last4: txnData.authorization?.last4,
        card_type: txnData.authorization?.card_type,
        bank: txnData.authorization?.bank,
        verified_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id);

    if (updateError) {
      console.error('[paystack-verify] Failed to update payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[paystack-verify] Payment verified:', {
      paymentId: payment.id,
      status: paymentStatus,
      reference,
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentStatus,
        paymentId: payment.id,
        amount: payment.amount_cents,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[paystack-verify] Error:', error);
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
