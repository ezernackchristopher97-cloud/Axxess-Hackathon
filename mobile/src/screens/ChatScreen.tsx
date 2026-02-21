import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { conversationsApi, subscriptionApi, imageApi, imageEditApi } from '../services/api';
import { VoiceInput } from '../components/VoiceInput';
import { ShareConversation } from '../components/ShareConversation';
import { PromptTemplates } from '../components/PromptTemplates';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  regime?: string;
  absurdityScore?: number;
  confidence?: number;
  imageUrl?: string;
  generatedImageUrl?: string;
  isImageGeneration?: boolean;
  mirroringStrength?: number;
  compressionRatio?: number;
}

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(route.params?.conversationId || null);
  const [usage, setUsage] = useState<{ messagesUsed: number; limit: number; isPro: boolean } | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    loadUsage();
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  const loadUsage = async () => {
    try {
      const response = await subscriptionApi.getUsage();
      if (response.result?.data?.json) {
        setUsage(response.result.data.json);
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const response = await conversationsApi.getMessages(conversationId);
      if (response.result?.data?.json) {
        setMessages(response.result.data.json);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if message is an image generation request
  const isImageGenerationRequest = (text: string): boolean => {
    const patterns = [
      /^(generate|create|make|draw|paint|design|produce)\s+(an?\s+)?(image|picture|photo|illustration|artwork|art|drawing|painting)/i,
      /^(image|picture|photo)\s+of\s+/i,
      /imagine\s+/i,
      /visualize\s+/i,
      /^show\s+me\s+(an?\s+)?(image|picture)/i,
    ];
    return patterns.some(pattern => pattern.test(text.trim()));
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    // Check usage limit
    if (usage && !usage.isPro && usage.messagesUsed >= usage.limit) {
      Alert.alert(
        'Daily Limit Reached',
        'You\'ve used all 10 free messages today. Upgrade to Pro for unlimited messages.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Check if this is an image generation request
    const isImageRequest = isImageGenerationRequest(messageText);
    if (isImageRequest) {
      setGeneratingImage(true);
    }

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Add typing indicator for image generation
    if (isImageRequest) {
      const typingMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '🎨 Generating image with AIModelG3 architecture...',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, typingMessage]);
    }

    try {
      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const createResponse = await conversationsApi.create();
        if (createResponse.result?.data?.json) {
          currentConversationId = createResponse.result.data.json.id;
          setConversationId(currentConversationId);
        }
      }

      if (!currentConversationId) {
        throw new Error('Failed to create conversation');
      }

      // Send message (backend will handle image generation detection)
      const response = await conversationsApi.sendMessage(currentConversationId, messageText);
      if (response.result?.data?.json) {
        const assistantMessage = response.result.data.json;
        
        // Replace temp messages with actual response
        setMessages(prev => {
          const filtered = prev.filter(m => 
            m.id !== tempUserMessage.id && 
            !m.content.includes('Generating image')
          );
          return [...filtered, { ...tempUserMessage, id: assistantMessage.id - 1 }, assistantMessage];
        });
        
        // Update usage
        loadUsage();
      }
    } catch (error: any) {
      // Remove optimistic messages on error
      setMessages(prev => prev.filter(m => 
        m.id !== tempUserMessage.id && 
        !m.content.includes('Generating image')
      ));
      
      if (error.message?.includes('limit')) {
        Alert.alert(
          'Daily Limit Reached',
          'Upgrade to Pro for unlimited messages.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
      setGeneratingImage(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    // Extract image URL from markdown if present
    const imageMatch = item.content.match(/!\[.*?\]\((.*?)\)/);
    const imageUrl = item.generatedImageUrl || item.imageUrl || (imageMatch ? imageMatch[1] : null);
    
    // Clean content for display (remove markdown image)
    let displayContent = item.content;
    if (imageMatch) {
      displayContent = item.content.replace(/!\[.*?\]\(.*?\)\n*/g, '').trim();
    }
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {/* Display generated image */}
          {imageUrl && !isUser && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.generatedImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          {/* Message text */}
          {displayContent && (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {displayContent}
            </Text>
          )}
          
          {/* Metadata for assistant messages */}
          {!isUser && (item.regime || item.mirroringStrength !== undefined) && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                {item.regime && `${item.regime}`}
                {item.mirroringStrength !== undefined && ` • ${Math.round(item.mirroringStrength * 100)}% mirroring`}
                {item.compressionRatio !== undefined && ` • ${Math.round(item.compressionRatio * 100)}% compressed`}
              </Text>
            </View>
          )}
          
          {/* Image generation badge */}
          {item.isImageGeneration && (
            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>🎨 AI Generated</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {/* Usage indicator */}
      {usage && !usage.isPro && (
        <View style={styles.usageBar}>
          <Text style={styles.usageText}>
            {usage.limit - usage.messagesUsed} / {usage.limit} messages remaining
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.upgradeLink}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Start a Conversation</Text>
          <Text style={styles.emptySubtitle}>
            Ask anything - powered by AIModelG3 with neural pruning, entropy mirroring, and multi-agent consensus
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setInputText('Generate an image of ')}
            >
              <Text style={styles.quickActionIcon}>🎨</Text>
              <Text style={styles.quickActionText}>Generate Image</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setInputText('Explain ')}
            >
              <Text style={styles.quickActionIcon}>💡</Text>
              <Text style={styles.quickActionText}>Ask Question</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {/* Image generation indicator */}
      {generatingImage && (
        <View style={styles.generatingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.generatingText}>Generating image with AIModelG3...</Text>
        </View>
      )}

      {/* Input area */}
      <View style={styles.inputContainer}>
        <PromptTemplates onSelectTemplate={(prompt) => setInputText(prompt)} />
        <VoiceInput
          onTranscription={(text) => setInputText(prev => prev ? `${prev} ${text}` : text)}
          disabled={sending || generatingImage}
          size={40}
        />
        <TextInput
          style={styles.input}
          placeholder="Type, speak, or 'generate/edit image...'"
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
        />
        {conversationId && (
          <ShareConversation
            conversationId={conversationId}
            conversationTitle={route.params?.title || 'Chat'}
          />
        )}
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  usageBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  usageText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  upgradeLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.backgroundCard,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: colors.background,
  },
  assistantText: {
    color: colors.text,
  },
  imageContainer: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  generatedImage: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: borderRadius.md,
  },
  imageBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  imageBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  metadata: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metadataText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  generatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    gap: spacing.sm,
  },
  generatingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 120,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundCard,
  },
  sendButtonText: {
    fontSize: fontSize.xl,
    color: colors.background,
    fontWeight: 'bold',
  },
});
