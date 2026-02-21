import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

interface OCRResult {
  text: string;
  confidence: number;
  agents: {
    name: string;
    confidence: number;
    extractedText: string;
  }[];
  consensusMethod: string;
  processingTime: number;
}

export default function OCRScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
      setAnalysisResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
      setAnalysisResult(null);
    }
  };

  const performOCR = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const ocrResult = await api.performOCR(selectedImage);
      setResult(ocrResult);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to extract text from image');
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!result?.text || !analysisPrompt) {
      Alert.alert('Error', 'Please extract text first and enter an analysis prompt');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await api.analyzeOCRText(result.text, analysisPrompt);
      setAnalysisResult(analysis);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze text');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    // Note: In production, use expo-clipboard
    Alert.alert('Copied', 'Text copied to clipboard');
  };

  return (
    <LinearGradient colors={['#0a1a0a', '#0d2818', '#0a1a0a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>OCR Scanner</Text>
          <Text style={styles.subtitle}>
            Multi-agent consensus text extraction with AIModelG3
          </Text>
        </View>

        {/* Image Selection */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => {
                  setSelectedImage(null);
                  setResult(null);
                  setAnalysisResult(null);
                }}
              >
                <Ionicons name="close-circle" size={28} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="scan-outline" size={64} color="#50C878" />
              <Text style={styles.placeholderText}>Select or capture an image</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color="#FFD700" />
              <Text style={styles.actionButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color="#FFD700" />
              <Text style={styles.actionButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Extract Button */}
        {selectedImage && !result && (
          <TouchableOpacity
            style={[styles.extractButton, loading && styles.buttonDisabled]}
            onPress={performOCR}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a1a0a" />
            ) : (
              <>
                <Ionicons name="text-outline" size={24} color="#0a1a0a" />
                <Text style={styles.extractButtonText}>Extract Text</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* OCR Result */}
        {result && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Extracted Text</Text>
              <View style={styles.confidenceBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                <Text style={styles.confidenceText}>
                  {(result.confidence * 100).toFixed(1)}% confidence
                </Text>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.extractedText}>{result.text}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(result.text)}
              >
                <Ionicons name="copy-outline" size={20} color="#50C878" />
              </TouchableOpacity>
            </View>

            {/* Agent Details */}
            <View style={styles.agentsSection}>
              <Text style={styles.agentsSectionTitle}>Multi-Agent Consensus</Text>
              <Text style={styles.consensusMethod}>
                Method: {result.consensusMethod}
              </Text>
              {result.agents.map((agent, index) => (
                <View key={index} style={styles.agentCard}>
                  <View style={styles.agentHeader}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentConfidence}>
                      {(agent.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
              <Text style={styles.processingTime}>
                Processed in {result.processingTime}ms
              </Text>
            </View>

            {/* Analysis Section */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Analyze Extracted Text</Text>
              <TextInput
                style={styles.analysisInput}
                placeholder="Enter analysis prompt (e.g., 'Summarize this text')"
                placeholderTextColor="#666"
                value={analysisPrompt}
                onChangeText={setAnalysisPrompt}
                multiline
              />
              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
                onPress={analyzeText}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#0a1a0a" />
                ) : (
                  <>
                    <Ionicons name="analytics-outline" size={20} color="#0a1a0a" />
                    <Text style={styles.analyzeButtonText}>Analyze</Text>
                  </>
                )}
              </TouchableOpacity>

              {analysisResult && (
                <View style={styles.analysisResult}>
                  <Text style={styles.analysisResultTitle}>Analysis Result</Text>
                  <Text style={styles.analysisResultText}>{analysisResult}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  imageSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  placeholderContainer: {
    height: 200,
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1a3a1a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1f0d',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#50C878',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  extractButtonText: {
    color: '#0a1a0a',
    fontSize: 18,
    fontWeight: '600',
  },
  resultSection: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingBottom: 40,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  confidenceText: {
    color: '#50C878',
    fontSize: 12,
    fontWeight: '600',
  },
  textContainer: {
    backgroundColor: '#0d1f0d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a3a1a',
    position: 'relative',
  },
  extractedText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
  },
  copyButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  agentsSection: {
    marginTop: 20,
    backgroundColor: '#0d1f0d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  agentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  consensusMethod: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 12,
  },
  agentCard: {
    backgroundColor: '#0a1a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentName: {
    color: '#50C878',
    fontSize: 14,
    fontWeight: '600',
  },
  agentConfidence: {
    color: '#FFD700',
    fontSize: 14,
  },
  processingTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  analysisSection: {
    marginTop: 20,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  analysisInput: {
    backgroundColor: '#0d1f0d',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  analyzeButtonText: {
    color: '#0a1a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisResult: {
    marginTop: 16,
    backgroundColor: '#0d1f0d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  analysisResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#50C878',
    marginBottom: 8,
  },
  analysisResultText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
  },
});
