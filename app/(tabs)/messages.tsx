import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';

import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationAsRead,
  getConversationDetails,
  subscribeToMessages,
  subscribeToConversations,
  unsubscribe,
  ConversationWithDetails,
  ChatMessage,
} from '@/lib/chat';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

type ViewMode = 'list' | 'chat';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function MessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const { isAuthenticated, user } = useAuthStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const data = await fetchConversations(user.id);
    setConversations(data);
    setIsLoading(false);
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    setIsLoadingMessages(true);
    const data = await fetchMessages(conversationId, user.id);
    setMessages(data);
    setIsLoadingMessages(false);
    await markConversationAsRead(conversationId, user.id);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();

      conversationsChannelRef.current = subscribeToConversations(user.id, () => {
        loadConversations();
      });

      return () => {
        if (conversationsChannelRef.current) {
          unsubscribe(conversationsChannelRef.current);
        }
      };
    }
  }, [isAuthenticated, user, loadConversations]);

  useEffect(() => {
    if (params.conversationId && user && isAuthenticated) {
      const openConversation = async () => {
        const details = await getConversationDetails(params.conversationId!, user.id);
        if (details) {
          setSelectedConversation(details);
          setViewMode('chat');
          loadMessages(params.conversationId!);
        }
      };
      openConversation();
    }
  }, [params.conversationId, user, isAuthenticated, loadMessages]);

  useEffect(() => {
    if (selectedConversation && user) {
      if (messagesChannelRef.current) {
        unsubscribe(messagesChannelRef.current);
      }

      messagesChannelRef.current = subscribeToMessages(
        selectedConversation.id,
        user.id,
        (newMessage) => {
          if (!newMessage.isFromMe) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            markConversationAsRead(selectedConversation.id, user.id);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      );

      return () => {
        if (messagesChannelRef.current) {
          unsubscribe(messagesChannelRef.current);
        }
      };
    }
  }, [selectedConversation, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !selectedConversation || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      isFromMe: true,
      isRead: false,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const result = await sendMessage(selectedConversation.id, user.id, content);

    if (result.error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setInputText(content);
    } else if (result.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? result.message! : m))
      );
    }

    setIsSending(false);
  };

  const handleOpenConversation = async (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation);
    setViewMode('chat');
    loadMessages(conversation.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedConversation(null);
    setMessages([]);
    loadConversations();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="chatbubbles" size={64} color={colors.primary.DEFAULT} />
          </View>
          <Text style={styles.authTitle}>Messages</Text>
          <Text style={styles.authDescription}>
            Sign in to chat with other students about listings. No phone numbers shared.
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/welcome')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === 'chat' && selectedConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={0}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Avatar
                name={selectedConversation.otherParticipant.name}
                uri={selectedConversation.otherParticipant.avatar}
                size="md"
              />
              <View style={styles.chatHeaderText}>
                <Text style={styles.chatHeaderName}>
                  {selectedConversation.otherParticipant.name}
                </Text>
                <Text style={styles.chatHeaderStatus}>
                  {selectedConversation.otherParticipant.role}
                  {selectedConversation.otherParticipant.campusShortName
                    ? ` • ${selectedConversation.otherParticipant.campusShortName}`
                    : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text.dark} />
            </TouchableOpacity>
          </View>

          {/* Listing Reference */}
          {selectedConversation.listing && (
            <TouchableOpacity
              style={styles.listingReference}
              onPress={() => router.push(`/listing/${selectedConversation.listing?.id}`)}
            >
              {selectedConversation.listing.image && (
                <Image
                  source={{ uri: selectedConversation.listing.image }}
                  style={styles.listingThumb}
                  contentFit="cover"
                />
              )}
              <View style={styles.listingRefContent}>
                <Text style={styles.listingRefTitle} numberOfLines={1}>
                  {selectedConversation.listing.title}
                </Text>
                <Text style={styles.listingRefPrice}>R{selectedConversation.listing.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.gray} />
            </TouchableOpacity>
          )}

          {/* Messages */}
          {isLoadingMessages ? (
            <View style={styles.loadingMessages}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[styles.messageBubble, item.isFromMe ? styles.myMessage : styles.theirMessage]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.isFromMe ? styles.myMessageText : styles.theirMessageText,
                    ]}
                  >
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      item.isFromMe ? styles.myMessageTime : styles.theirMessageTime,
                    ]}
                  >
                    {item.createdAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <Text style={styles.emptyMessagesText}>
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.text.light}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.text.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? colors.text.white : colors.text.gray}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const renderConversationItem = ({ item }: { item: ConversationWithDetails }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => handleOpenConversation(item)}>
      <Avatar name={item.otherParticipant.name} uri={item.otherParticipant.avatar} size="lg" />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.otherParticipant.name}</Text>
          <Text style={styles.conversationTime}>{formatTimeAgo(item.updatedAt)}</Text>
        </View>
        {item.listing && (
          <Text style={styles.conversationListing} numberOfLines={1}>
            Re: {item.listing.title}
          </Text>
        )}
        <Text
          style={[
            styles.conversationMessage,
            item.unreadCount > 0 && styles.conversationMessageUnread,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage
            ? item.lastMessage.isFromMe
              ? `You: ${item.lastMessage.content}`
              : item.lastMessage.content
            : 'No messages yet'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.text.gray} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyText}>
        Start a conversation by contacting a seller on a listing you're interested in.
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.browseButtonText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  conversationTime: {
    fontSize: fontSize.xs,
    color: colors.text.light,
  },
  conversationListing: {
    fontSize: fontSize.xs,
    color: colors.primary.DEFAULT,
    marginTop: 2,
  },
  conversationMessage: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: 4,
  },
  conversationMessageUnread: {
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  browseButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  browseButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.white,
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  authTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  authDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  authButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  authButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.white,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  chatHeaderText: {
    marginLeft: spacing.md,
  },
  chatHeaderName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  chatHeaderStatus: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingReference: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listingThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  listingRefContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listingRefTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  listingRefPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary.DEFAULT,
  },
  loadingMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyMessagesText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.DEFAULT,
    borderBottomRightRadius: borderRadius.sm,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background.white,
    borderBottomLeftRadius: borderRadius.sm,
    ...shadows.sm,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  myMessageText: {
    color: colors.text.white,
  },
  theirMessageText: {
    color: colors.text.dark,
  },
  messageTime: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: colors.text.gray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.dark,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
});
