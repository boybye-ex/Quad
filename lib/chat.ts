import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sendNewMessageNotificationForConversation } from './pushService';

export interface Participant {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'student' | 'ta' | 'admin';
  is_verified: boolean;
  campus_id: string | null;
}

export interface ListingReference {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export interface ConversationMessage {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  listing_id: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  participant_1?: Participant;
  participant_2?: Participant;
  listing?: ListingReference;
  last_message?: ConversationMessage;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationWithDetails {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    campusShortName?: string;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    image?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  isFromMe: boolean;
  isRead: boolean;
  createdAt: Date;
}

export async function fetchConversations(userId: string): Promise<ConversationWithDetails[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_1:profiles!conversations_participant_1_id_fkey(id, name, avatar_url, role, is_verified, campus_id),
      participant_2:profiles!conversations_participant_2_id_fkey(id, name, avatar_url, role, is_verified, campus_id),
      listing:listings(id, title, price, images),
      last_message:messages!conversations_last_message_id_fkey(id, content, sender_id, is_read, created_at)
    `)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  const conversations: ConversationWithDetails[] = [];

  for (const conv of data || []) {
    const isParticipant1 = conv.participant_1_id === userId;
    const otherParticipantData = isParticipant1 ? conv.participant_2 : conv.participant_1;

    if (!otherParticipantData) continue;

    const { data: unreadData } = await supabase.rpc('get_unread_count', {
      p_conversation_id: conv.id,
      p_user_id: userId,
    });

    conversations.push({
      id: conv.id,
      otherParticipant: {
        id: otherParticipantData.id,
        name: otherParticipantData.name,
        avatar: otherParticipantData.avatar_url || undefined,
        role: otherParticipantData.role,
        campusShortName: undefined,
      },
      listing: conv.listing
        ? {
            id: conv.listing.id,
            title: conv.listing.title,
            price: conv.listing.price,
            image: conv.listing.images?.[0],
          }
        : undefined,
      lastMessage: conv.last_message
        ? {
            content: conv.last_message.content,
            createdAt: new Date(conv.last_message.created_at),
            isFromMe: conv.last_message.sender_id === userId,
          }
        : undefined,
      unreadCount: unreadData || 0,
      updatedAt: new Date(conv.updated_at),
    });
  }

  return conversations;
}

export async function fetchMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map((msg) => ({
    id: msg.id,
    content: msg.content,
    isFromMe: msg.sender_id === userId,
    isRead: msg.is_read,
    createdAt: new Date(msg.created_at),
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  senderName?: string
): Promise<{ message: ChatMessage | null; error?: string }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { message: null, error: error.message };
  }

  // Send push notification to the recipient (async, non-blocking)
  // We don't await this to avoid slowing down the message send flow
  if (senderName) {
    sendNewMessageNotificationForConversation(
      conversationId,
      senderId,
      senderName,
      content
    ).catch((err) => {
      // Log but don't fail the message send if push notification fails
      console.warn('[Chat] Push notification failed:', err);
    });
  }

  return {
    message: {
      id: data.id,
      content: data.content,
      isFromMe: true,
      isRead: data.is_read,
      createdAt: new Date(data.created_at),
    },
  };
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string
): Promise<{ conversationId: string | null; error?: string }> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_user_id: userId,
    p_other_user_id: otherUserId,
    p_listing_id: listingId || null,
  });

  if (error) {
    console.error('Error getting/creating conversation:', error);
    return { conversationId: null, error: error.message };
  }

  return { conversationId: data };
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });
}

export async function getConversationDetails(
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_1:profiles!conversations_participant_1_id_fkey(id, name, avatar_url, role, is_verified, campus_id),
      participant_2:profiles!conversations_participant_2_id_fkey(id, name, avatar_url, role, is_verified, campus_id),
      listing:listings(id, title, price, images)
    `)
    .eq('id', conversationId)
    .single();

  if (error || !data) {
    console.error('Error fetching conversation details:', error);
    return null;
  }

  const isParticipant1 = data.participant_1_id === userId;
  const otherParticipantData = isParticipant1 ? data.participant_2 : data.participant_1;

  if (!otherParticipantData) return null;

  const { data: unreadData } = await supabase.rpc('get_unread_count', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });

  return {
    id: data.id,
    otherParticipant: {
      id: otherParticipantData.id,
      name: otherParticipantData.name,
      avatar: otherParticipantData.avatar_url || undefined,
      role: otherParticipantData.role,
      campusShortName: undefined,
    },
    listing: data.listing
      ? {
          id: data.listing.id,
          title: data.listing.title,
          price: data.listing.price,
          image: data.listing.images?.[0],
        }
      : undefined,
    unreadCount: unreadData || 0,
    updatedAt: new Date(data.updated_at),
  };
}

export function subscribeToMessages(
  conversationId: string,
  userId: string,
  onMessage: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as Message;
        onMessage({
          id: msg.id,
          content: msg.content,
          isFromMe: msg.sender_id === userId,
          isRead: msg.is_read,
          createdAt: new Date(msg.created_at),
        });
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToConversations(
  userId: string,
  onUpdate: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        const conv = payload.new as Conversation;
        if (conv.participant_1_id === userId || conv.participant_2_id === userId) {
          onUpdate();
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
