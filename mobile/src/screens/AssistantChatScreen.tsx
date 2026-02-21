import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';
import { chatWithFeatherless, ChatMessage } from '../services/featherless';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are NeuroSync Care Assistant, a supportive health information companion for patients with Parkinson's disease and related neurological conditions. 

CONSTRAINTS:
- Informational support only. Never diagnose, prescribe, or replace medical professionals.
- Always recommend consulting a healthcare provider for medical decisions.
- Be empathetic, clear, and concise.
- Focus on: symptom awareness, medication timing reminders, lifestyle suggestions, caregiver coordination tips, and emotional support.
- If asked about specific drug dosages or treatment changes, redirect to their neurologist.
- Use plain language.`;

const QUICK_PROMPTS = [
  'How can I manage morning tremors?',
  'Tips for freeze episodes',
  'When should I call my caregiver?',
  'Help with medication timing',
  'Sleep tips for Parkinson\'s',
];

export default function AssistantChatScreen() {
  const { isDemoMode } = useDemoMode();
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I\'m your NeuroSync Care Assistant. I\'m here to provide supportive health information and help you manage your daily routine. How can I help you today?\n\n*Remember: I provide informational support only. Always consult your healthcare provider for medical decisions.*',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
          .filter(m => m.role !== 'system')
          .slice(-10) // Keep last 10 messages for context
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: messageText },
      ];

      const response = await chatWithFeatherless(apiMessages, isDemoMode);

      const assistantMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again, or check your connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: DisplayMessage) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantHeader}>
            <Text style={styles.assistantLabel}>NeuroSync Assistant</Text>
          </View>
        )}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE — Mock AI Responses</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              This assistant provides informational support only. It does not diagnose or prescribe. Always consult your healthcare provider.
            </Text>
          </View>

          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickPromptsContainer}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {QUICK_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPrompt}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about symptoms, medications, wellness..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  demoBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 4,
    alignItems: 'center',
  },
  demoBannerText: { color: '#000', fontWeight: 'bold', fontSize: fontSize.xs },
  keyboardView: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: spacing.md, paddingBottom: spacing.md },
  disclaimer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.backgroundLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assistantHeader: {
    marginBottom: spacing.xs,
  },
  assistantLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  messageText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.background,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(10, 31, 26, 0.6)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  quickPromptsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickPromptsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  quickPrompt: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  quickPromptText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundLight,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
