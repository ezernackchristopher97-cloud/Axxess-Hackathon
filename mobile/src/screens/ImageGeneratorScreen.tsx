import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { imageApi } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

const STYLE_OPTIONS = [
  { id: 'auto', name: 'Auto', icon: '✨' },
  { id: 'photorealistic', name: 'Photo', icon: '📷' },
  { id: 'artistic', name: 'Artistic', icon: '🎨' },
  { id: 'minimalist', name: 'Minimal', icon: '◻️' },
  { id: 'cinematic', name: 'Cinema', icon: '🎬' },
  { id: 'illustration', name: 'Illustrate', icon: '✏️' },
  { id: 'abstract', name: 'Abstract', icon: '🌀' },
];

interface GeneratedImage {
  id: number;
  prompt: string;
  optimizedPrompt?: string;
  imageUrl: string;
  style?: string;
  entropyState?: string;
  createdAt: string;
}

export default function ImageGeneratorScreen() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [generating, setGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await imageApi.getHistory(10);
      if (response.result?.data?.json) {
        setHistory(response.result.data.json);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    try {
      const response = await imageApi.generate(prompt, selectedStyle !== 'auto' ? selectedStyle : undefined);
      if (response.result?.data?.json) {
        const newImage = response.result.data.json;
        setCurrentImage(newImage);
        setHistory(prev => [newImage, ...prev]);
        setPrompt('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const renderStyleOption = ({ item }: { item: typeof STYLE_OPTIONS[0] }) => (
    <TouchableOpacity
      style={[
        styles.styleOption,
        selectedStyle === item.id && styles.styleOptionSelected,
      ]}
      onPress={() => setSelectedStyle(item.id)}
    >
      <Text style={styles.styleIcon}>{item.icon}</Text>
      <Text style={[
        styles.styleName,
        selectedStyle === item.id && styles.styleNameSelected,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: GeneratedImage }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => setCurrentImage(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.historyImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Image Generator</Text>
        <Text style={styles.subtitle}>
          Powered by AIModelG3 with entropy-optimized prompts
        </Text>
      </View>

      {/* Current/Generated Image */}
      <View style={styles.imageSection}>
        {generating ? (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.generatingText}>
              Generating with AIModelG3 architecture...
            </Text>
            <Text style={styles.generatingSubtext}>
              Neural pruning • Entropy analysis • Style encoding
            </Text>
          </View>
        ) : currentImage ? (
          <View style={styles.currentImageContainer}>
            <Image
              source={{ uri: currentImage.imageUrl }}
              style={styles.currentImage}
              resizeMode="cover"
            />
            <View style={styles.imageInfo}>
              <Text style={styles.imagePrompt} numberOfLines={2}>
                {currentImage.optimizedPrompt || currentImage.prompt}
              </Text>
              <View style={styles.imageMeta}>
                {currentImage.style && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{currentImage.style}</Text>
                  </View>
                )}
                {currentImage.entropyState && (
                  <View style={[styles.metaBadge, styles.entropyBadge]}>
                    <Text style={styles.metaBadgeText}>{currentImage.entropyState} entropy</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
            <Text style={styles.placeholderText}>
              Enter a prompt below to generate an image
            </Text>
          </View>
        )}
      </View>

      {/* Style Selection */}
      <View style={styles.styleSection}>
        <Text style={styles.sectionTitle}>Style</Text>
        <FlatList
          data={STYLE_OPTIONS}
          renderItem={renderStyleOption}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.styleList}
        />
      </View>

      {/* Prompt Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Describe the image you want to create..."
          placeholderTextColor={colors.textMuted}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.generateButton, (!prompt.trim() || generating) && styles.generateButtonDisabled]}
          onPress={generateImage}
          disabled={!prompt.trim() || generating}
        >
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate Image'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Generations</Text>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        </View>
      )}

      {/* Architecture Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🧠</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Neural Pruning</Text>
            <Text style={styles.infoText}>Optimizes your prompt for better results</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📊</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Entropy Analysis</Text>
            <Text style={styles.infoText}>Adapts style based on prompt complexity</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🎯</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Quaternion Encoding</Text>
            <Text style={styles.infoText}>Geometric style representation</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  imageSection: {
    marginBottom: spacing.lg,
  },
  generatingContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  generatingText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  generatingSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  currentImageContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  currentImage: {
    width: '100%',
    height: screenWidth - spacing.md * 2,
    borderRadius: borderRadius.lg,
  },
  imageInfo: {
    padding: spacing.md,
  },
  imagePrompt: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  imageMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  entropyBadge: {
    backgroundColor: colors.accent + '20',
  },
  metaBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  placeholderContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  styleSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  styleList: {
    gap: spacing.sm,
  },
  styleOption: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  styleIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  styleName: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  styleNameSelected: {
    color: colors.primary,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: colors.backgroundCard,
  },
  generateButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  infoSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  infoText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
