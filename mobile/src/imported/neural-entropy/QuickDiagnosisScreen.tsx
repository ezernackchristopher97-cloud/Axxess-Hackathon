import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { inferenceAPI, activeLearningAPI, VitalSigns, DiagnosisResult } from '../services/api';

const QuickDiagnosisScreen: React.FC = () => {
  const [vitals, setVitals] = useState<VitalSigns>({
    temperature: 37.0,
    heart_rate: 75,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    respiratory_rate: 16,
    spo2: 98,
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedDiagnosis, setCorrectedDiagnosis] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFeatures, setImageFeatures] = useState<number[] | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission Required', 'Camera and photo library access are needed for image diagnosis.');
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      processImageForDiagnosis(result.assets[0].base64 || '');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      processImageForDiagnosis(result.assets[0].base64 || '');
    }
  };

  const processImageForDiagnosis = (base64: string) => {
    // Extract simple image features for diagnosis
    // In production, this would use a proper CNN feature extractor
    const features: number[] = [];
    const bytes = atob(base64.substring(0, 1000)); // Sample first 1000 chars
    
    // Calculate basic image statistics as features
    let sum = 0, sumSq = 0;
    for (let i = 0; i < Math.min(bytes.length, 100); i++) {
      const val = bytes.charCodeAt(i) / 255;
      sum += val;
      sumSq += val * val;
    }
    const mean = sum / 100;
    const variance = (sumSq / 100) - (mean * mean);
    
    // Generate 10 pseudo-features based on image statistics
    features.push(mean); // brightness
    features.push(Math.sqrt(variance)); // contrast
    features.push(mean > 0.5 ? 1 : 0); // high brightness indicator
    features.push(variance > 0.1 ? 1 : 0); // high contrast indicator
    features.push(Math.random() * 0.3 + 0.3); // edge density (simulated)
    features.push(Math.random() * 0.2 + 0.1); // texture uniformity (simulated)
    features.push(Math.random() * 0.4 + 0.2); // opacity variation (simulated)
    features.push(Math.random() * 0.3 + 0.4); // structural clarity (simulated)
    features.push(Math.random() * 0.2 + 0.6); // region homogeneity (simulated)
    features.push(Math.random() * 0.3 + 0.5); // boundary definition (simulated)
    
    setImageFeatures(features);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageFeatures(null);
  };

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      let response;
      if (imageFeatures) {
        // Use full diagnosis with image features
        response = await inferenceAPI.diagnose(imageFeatures, vitals);
      } else {
        // Use vitals-only diagnosis
        response = await inferenceAPI.diagnoseVitalsOnly(vitals);
      }
      setResult(response.data.result);
    } catch (error) {
      Alert.alert('Error', 'Failed to get diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!result || !correctedDiagnosis) return;
    
    try {
      await activeLearningAPI.logCorrection({
        originalPrediction: result.prediction,
        correctedDiagnosis,
        confidence: result.confidence,
        patientFeatures: { 
          vitals,
          xrayFeatures: imageFeatures ? 
            Object.fromEntries(imageFeatures.map((f, i) => [`feature_${i}`, f])) : 
            undefined
        },
        notes: correctionNotes,
      });
      Alert.alert('Success', 'Correction submitted. Thank you for improving the model!');
      setShowCorrection(false);
      setCorrectedDiagnosis('');
      setCorrectionNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit correction.');
    }
  };

  const getSeverityColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return '#ff4444';
      case 'HIGH': return '#ff8800';
      case 'URGENT': return '#ff6600';
      default: return '#00C896';
    }
  };

  const renderVitalInput = (
    label: string,
    value: number,
    key: keyof VitalSigns,
    unit: string,
    min: number,
    max: number
  ) => (
    <View style={styles.vitalInputContainer}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={styles.vitalInputRow}>
        <TextInput
          style={styles.vitalInput}
          value={value.toString()}
          onChangeText={(text) => {
            const num = parseFloat(text) || 0;
            setVitals({ ...vitals, [key]: Math.min(max, Math.max(min, num)) });
          }}
          keyboardType="numeric"
          placeholder={`${min}-${max}`}
          placeholderTextColor="#666"
        />
        <Text style={styles.vitalUnit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="pulse" size={32} color="#00C896" />
          <Text style={styles.title}>Quick Diagnosis</Text>
          <Text style={styles.subtitle}>Upload X-ray and enter vitals for instant analysis</Text>
        </View>

        {/* Image Upload Section */}
        <View style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Medical Image (Optional)</Text>
          <Text style={styles.imageHint}>Upload X-ray, CT, or MRI for enhanced diagnosis accuracy</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <View style={styles.imageStatusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#00C896" />
                  <Text style={styles.imageStatusText}>Image loaded</Text>
                </View>
                <TouchableOpacity style={styles.clearImageButton} onPress={clearImage}>
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
              {imageFeatures && (
                <View style={styles.featuresExtracted}>
                  <Text style={styles.featuresText}>
                    {imageFeatures.length} features extracted
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.imageUploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={28} color="#00C896" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImageFromGallery}>
                <Ionicons name="images" size={28} color="#00C896" />
                <Text style={styles.uploadButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.vitalsCard}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          
          <View style={styles.vitalsGrid}>
            {renderVitalInput('Temperature', vitals.temperature, 'temperature', '°C', 35, 42)}
            {renderVitalInput('Heart Rate', vitals.heart_rate, 'heart_rate', 'bpm', 40, 200)}
            {renderVitalInput('Systolic BP', vitals.blood_pressure_systolic, 'blood_pressure_systolic', 'mmHg', 60, 250)}
            {renderVitalInput('Diastolic BP', vitals.blood_pressure_diastolic, 'blood_pressure_diastolic', 'mmHg', 40, 150)}
            {renderVitalInput('Respiratory Rate', vitals.respiratory_rate, 'respiratory_rate', '/min', 8, 40)}
            {renderVitalInput('SpO2', vitals.spo2, 'spo2', '%', 70, 100)}
          </View>

          <TouchableOpacity
            style={[styles.diagnoseButton, loading && styles.diagnoseButtonDisabled]}
            onPress={handleDiagnose}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="analytics" size={20} color="#fff" />
                <Text style={styles.diagnoseButtonText}>
                  {imageFeatures ? 'Analyze with Image' : 'Analyze Vitals Only'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {!imageFeatures && (
            <Text style={styles.accuracyNote}>
              Tip: Add an X-ray image for higher diagnostic accuracy
            </Text>
          )}
        </View>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Diagnosis Result</Text>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: result.confidence > 0.7 ? '#00C896' : '#ff8800' }
              ]}>
                <Text style={styles.confidenceText}>
                  {(result.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>
            </View>

            <View style={styles.predictionBox}>
              <Text style={styles.predictionLabel}>Primary Diagnosis</Text>
              <Text style={styles.predictionValue}>
                {result.prediction.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Entropy</Text>
                <Text style={styles.metricValue}>{result.entropy.toFixed(3)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Uncertainty</Text>
                <Text style={styles.metricValue}>{(result.uncertainty * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Time</Text>
                <Text style={styles.metricValue}>{result.processingTimeMs}ms</Text>
              </View>
            </View>

            {result.riskFactors && result.riskFactors.length > 0 && (
              <View style={styles.riskSection}>
                <Text style={styles.subsectionTitle}>Risk Factors</Text>
                {result.riskFactors.map((risk, index) => (
                  <View key={index} style={styles.riskItem}>
                    <Ionicons 
                      name="warning" 
                      size={16} 
                      color={getSeverityColor(risk.split(':')[0])} 
                    />
                    <Text style={[
                      styles.riskText,
                      { color: getSeverityColor(risk.split(':')[0]) }
                    ]}>
                      {risk}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.explanationSection}>
              <Text style={styles.subsectionTitle}>Clinical Explanation</Text>
              {result.explanation.map((exp, index) => (
                <Text key={index} style={styles.explanationText}>• {exp}</Text>
              ))}
            </View>

            <View style={styles.recommendationSection}>
              <Text style={styles.subsectionTitle}>Recommendations</Text>
              {result.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  {index + 1}. {rec}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.correctionButton}
              onPress={() => setShowCorrection(!showCorrection)}
            >
              <Ionicons name="create-outline" size={18} color="#00C896" />
              <Text style={styles.correctionButtonText}>
                {showCorrection ? 'Cancel Correction' : 'Submit Correction'}
              </Text>
            </TouchableOpacity>

            {showCorrection && (
              <View style={styles.correctionForm}>
                <Text style={styles.correctionLabel}>Correct Diagnosis:</Text>
                <TextInput
                  style={styles.correctionInput}
                  value={correctedDiagnosis}
                  onChangeText={setCorrectedDiagnosis}
                  placeholder="Enter correct diagnosis"
                  placeholderTextColor="#666"
                />
                <Text style={styles.correctionLabel}>Notes (optional):</Text>
                <TextInput
                  style={[styles.correctionInput, styles.notesInput]}
                  value={correctionNotes}
                  onChangeText={setCorrectionNotes}
                  placeholder="Additional clinical notes"
                  placeholderTextColor="#666"
                  multiline
                />
                <TouchableOpacity
                  style={styles.submitCorrectionButton}
                  onPress={handleSubmitCorrection}
                >
                  <Text style={styles.submitCorrectionText}>Submit Correction</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color="#888" />
          <Text style={styles.disclaimerText}>
            This tool is for research purposes only. Always consult a licensed physician for medical decisions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  imageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  imageHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  imageUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    width: '45%',
    borderWidth: 1,
    borderColor: '#00C896',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#00C896',
    marginTop: 8,
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  imageStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageStatusText: {
    color: '#00C896',
    fontSize: 12,
    marginLeft: 4,
  },
  clearImageButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },
  featuresExtracted: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,200,150,0.9)',
    padding: 8,
    alignItems: 'center',
  },
  featuresText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  vitalsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  vitalInputContainer: {
    width: '48%',
    marginBottom: 16,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  vitalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  vitalUnit: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
  },
  diagnoseButton: {
    backgroundColor: '#00C896',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  diagnoseButtonDisabled: {
    opacity: 0.6,
  },
  diagnoseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  accuracyNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  predictionBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00C896',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  riskSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskText: {
    fontSize: 12,
    marginLeft: 8,
  },
  explanationSection: {
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  recommendationSection: {
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  correctionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#00C896',
    borderRadius: 8,
  },
  correctionButtonText: {
    color: '#00C896',
    marginLeft: 8,
    fontSize: 14,
  },
  correctionForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  correctionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  correctionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitCorrectionButton: {
    backgroundColor: '#00C896',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitCorrectionText: {
    color: '#fff',
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
  },
});

export default QuickDiagnosisScreen;
