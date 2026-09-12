import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { mockConversations, mockUsers, formatTimeAgo } from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Conversation, Message } from '@/types';

type ViewMode = 'list' | 'chat';

interface ChatMessage {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (selectedConversation) {
      setMessages([
        {
          id: '1',
          text: 'Hi! Is this still available?',
          isMe: false,
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          id: '2',
          text: 'Yes, it is! Are you interested?',
          isMe: true,
          timestamp: new Date(Date.now() - 55 * 60 * 1000),
        },
        {
          id: '3',
          text: "Great! Can we meet tomorrow on campus?",
          isMe: false,
          timestamp: new Date(Date.now() - 50 * 60 * 1000),
        },
        {
          id: '4',
          text: selectedConversation.lastMessage?.content || 'Sure, that works!',
          isMe: selectedConversation.lastMessage?.senderId !== user?.id,
          timestamp: selectedConversation.lastMessage?.createdAt || new Date(),
        },
      ]);
    }
  }, [selectedConversation, user?.id]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isMe: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getAutoReply(),
        isMe: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, replyMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const getAutoReply = () => {
    const replies = [
      "Sounds good!",
      "Let me check and get back to you.",
      "I'm available this afternoon if that works?",
      "Can you meet near the library?",
      "Thanks for your interest!",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setViewMode('chat');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedConversation(null);
    setMessages([]);
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
    const otherParticipant = selectedConversation.participants.find(
      (p) => p.id !== user?.id
    ) || mockUsers[1];

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
                name={otherParticipant.name}
                uri={otherParticipant.avatar}
                size="md"
              />
              <View style={styles.chatHeaderText}>
                <Text style={styles.chatHeaderName}>{otherParticipant.name}</Text>
                <Text style={styles.chatHeaderStatus}>
                  {otherParticipant.role}{otherParticipant.campus ? ` • ${otherParticipant.campus.shortName}` : ''}
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
              onPress={() =>
                router.push(`/listing/${selectedConversation.listing?.id}`)
              }
            >
              <Image
                source={{ uri: selectedConversation.listing.images[0] }}
                style={styles.listingThumb}
                contentFit="cover"
              />
              <View style={styles.listingRefContent}>
                <Text style={styles.listingRefTitle} numberOfLines={1}>
                  {selectedConversation.listing.title}
                </Text>
                <Text style={styles.listingRefPrice}>
                  ${selectedConversation.listing.price}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.gray} />
            </TouchableOpacity>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.isMe ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.isMe ? styles.myMessageText : styles.theirMessageText,
                  ]}
                >
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    item.isMe ? styles.myMessageTime : styles.theirMessageTime,
                  ]}
                >
                  {item.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />

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
              style={[
                styles.sendButton,
                inputText.trim() && styles.sendButtonActive,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? colors.text.white : colors.text.gray}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participants.find((p) => p.id !== user?.id) || mockUsers[1];

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleOpenConversation(item)}
      >
        <Avatar
          name={otherParticipant.name}
          uri={otherParticipant.avatar}
          size="lg"
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{otherParticipant.name}</Text>
            <Text style={styles.conversationTime}>
              {formatTimeAgo(item.updatedAt)}
            </Text>
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
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.text.gray} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyText}>
        Start a conversation by contacting a seller on a listing you're interested in.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.browseButtonText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={mockConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          mockConversations.length === 0 ? styles.emptyList : styles.listContent
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
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
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
