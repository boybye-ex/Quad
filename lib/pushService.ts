import { supabase, getExpoPushToken } from './supabase';

// =============================================================================
// PUSH NOTIFICATION SERVICE FOR QUAD
// =============================================================================
// This module provides a client-side interface for sending push notifications.
// It calls the Supabase Edge Function `send-push-notification` which handles
// the actual communication with Expo's Push API.
//
// DEPLOYMENT REQUIREMENTS:
// Before push notifications will work, you need to:
//
// 1. Deploy the Edge Function:
//    supabase functions deploy send-push-notification
//
// 2. Set the EXPO_ACCESS_TOKEN secret (optional but recommended):
//    - Go to https://expo.dev/accounts/[account]/settings/access-tokens
//    - Create a new token with push:send scope
//    - Set it in Supabase: supabase secrets set EXPO_ACCESS_TOKEN=xxx
//
// 3. Ensure EAS projectId is configured in app.json for token generation
//
// USAGE:
// The main entry point is `sendNewMessageNotification()` which is called
// when a new chat message is sent. It looks up the recipient's push token
// and sends a notification if one exists.
// =============================================================================

interface SendPushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Sends a push notification via the Supabase Edge Function.
 *
 * @param to - Expo push token (ExponentPushToken[xxx])
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional data payload (e.g., navigation data)
 * @returns Result with success status and optional ticketId or error
 */
export async function sendPushNotification(
  to: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<SendPushResult> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          to,
          title,
          body,
          data,
          channelId: 'chat', // Use the chat channel for message notifications
        },
      }
    );

    if (error) {
      console.error('[PushService] Edge function error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!responseData?.success) {
      return {
        success: false,
        error: responseData?.error || 'Unknown error from push service',
      };
    }

    return {
      success: true,
      ticketId: responseData.ticketId,
    };
  } catch (error) {
    console.error('[PushService] Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends a "new message" push notification to the recipient of a chat message.
 *
 * This function:
 * 1. Looks up the recipient's push token from their profile
 * 2. Sends a notification if they have a token registered
 * 3. Gracefully handles cases where the recipient has no token
 *
 * @param recipientId - The user ID of the message recipient
 * @param senderName - The name of the message sender (for the notification)
 * @param messagePreview - A preview of the message content
 * @param conversationId - The conversation ID (for navigation)
 * @returns Result indicating success/failure
 */
export async function sendNewMessageNotification(
  recipientId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<SendPushResult> {
  // Look up the recipient's push token
  const recipientToken = await getExpoPushToken(recipientId);

  if (!recipientToken) {
    // Recipient doesn't have push notifications enabled - this is normal
    console.log('[PushService] Recipient has no push token, skipping notification');
    return {
      success: true, // Not an error, just no-op
    };
  }

  // Truncate message preview for the notification
  const truncatedPreview =
    messagePreview.length > 100
      ? messagePreview.substring(0, 97) + '...'
      : messagePreview;

  return sendPushNotification(
    recipientToken,
    `New message from ${senderName}`,
    truncatedPreview,
    {
      conversationId,
      type: 'new_message',
    }
  );
}

/**
 * Alternative approach: Use the SQL function to get the recipient's token.
 * This is more efficient as it does the lookup in a single database call.
 *
 * @param conversationId - The conversation ID
 * @param senderId - The sender's user ID
 * @param senderName - The sender's name
 * @param messagePreview - A preview of the message
 * @returns Result indicating success/failure
 */
export async function sendNewMessageNotificationForConversation(
  conversationId: string,
  senderId: string,
  senderName: string,
  messagePreview: string
): Promise<SendPushResult> {
  // Use the SQL function to get the recipient's token in one call
  const { data: recipientToken, error } = await supabase.rpc(
    'get_conversation_recipient_push_token',
    {
      p_conversation_id: conversationId,
      p_sender_id: senderId,
    }
  );

  if (error) {
    console.error('[PushService] Error getting recipient token:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  if (!recipientToken) {
    // Recipient doesn't have push notifications enabled - this is normal
    console.log('[PushService] Recipient has no push token, skipping notification');
    return {
      success: true,
    };
  }

  const truncatedPreview =
    messagePreview.length > 100
      ? messagePreview.substring(0, 97) + '...'
      : messagePreview;

  return sendPushNotification(
    recipientToken,
    `New message from ${senderName}`,
    truncatedPreview,
    {
      conversationId,
      type: 'new_message',
    }
  );
}
