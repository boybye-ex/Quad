// =============================================================================
// SUPABASE EDGE FUNCTION: send-push-notification
// =============================================================================
// Sends push notifications via Expo's Push API.
//
// DEPLOYMENT STEPS:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Link your project: supabase link --project-ref YOUR_PROJECT_REF
// 3. Set the EXPO_ACCESS_TOKEN secret:
//    supabase secrets set EXPO_ACCESS_TOKEN=your_expo_access_token
//    (Get your token from: https://expo.dev/accounts/[account]/settings/access-tokens)
// 4. Deploy the function: supabase functions deploy send-push-notification
//
// USAGE:
// POST /functions/v1/send-push-notification
// Headers: Authorization: Bearer <supabase-anon-key>
// Body: {
//   "to": "ExponentPushToken[xxxxx]",
//   "title": "New Message",
//   "body": "You have a new message from John",
//   "data": { "conversationId": "uuid-here" }
// }
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationRequest {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse the request body
    const body: PushNotificationRequest = await req.json();

    // Validate required fields
    if (!body.to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the Expo access token from environment
    // TODO: Set this in Supabase secrets: supabase secrets set EXPO_ACCESS_TOKEN=xxx
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

    // Build the push notification payload
    const pushPayload = {
      to: body.to,
      title: body.title,
      body: body.body,
      data: body.data,
      sound: body.sound ?? 'default',
      badge: body.badge,
      channelId: body.channelId ?? 'default',
      categoryId: body.categoryId,
      priority: body.priority ?? 'high',
      ttl: body.ttl,
    };

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };

    // Add authorization header if we have an access token
    // The access token is optional but recommended for production
    if (expoAccessToken) {
      headers['Authorization'] = `Bearer ${expoAccessToken}`;
    } else {
      console.warn(
        '[send-push-notification] EXPO_ACCESS_TOKEN not set. ' +
        'Push notifications will work but with rate limits. ' +
        'Set it with: supabase secrets set EXPO_ACCESS_TOKEN=xxx'
      );
    }

    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(pushPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[send-push-notification] Expo API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Expo Push API error', details: errorText }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse Expo's response
    const result = await response.json();
    const ticket: ExpoPushTicket = Array.isArray(result.data)
      ? result.data[0]
      : result.data;

    if (ticket.status === 'error') {
      console.error('[send-push-notification] Push ticket error:', ticket);
      return new Response(
        JSON.stringify({
          success: false,
          error: ticket.message,
          errorType: ticket.details?.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[send-push-notification] Push sent successfully:', ticket.id);

    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticket.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[send-push-notification] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
