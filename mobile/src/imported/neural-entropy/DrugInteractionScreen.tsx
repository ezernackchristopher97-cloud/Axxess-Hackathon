import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { drugInteractionsAPI, RiskAssessment, DrugInteraction } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// NDC to drug name mapping (common medications)
const NDC_TO_DRUG: Record<string, string> = {
  '0002-4112': 'levodopa',
  '0002-4113': 'levodopa',
  '0591-0405': 'donepezil',
  '0591-0406': 'donepezil',
  '0456-3210': 'memantine',
  '0456-3220': 'memantine',
  '0071-0800': 'gabapentin',
  '0071-0801': 'gabapentin',
  '0071-0802': 'gabapentin',
  '0071-1018': 'pregabalin',
  '0071-1019': 'pregabalin',
  '0074-6114': 'valproic_acid',
  '0074-6212': 'valproic_acid',
  '0078-0510': 'carbamazepine',
  '0078-0511': 'carbamazepine',
  '0075-7500': 'riluzole',
  // Common brand names via UPC
  '300450449016': 'donepezil',
  '300450449023': 'donepezil',
  '300450523010': 'memantine',
  '300093715930': 'gabapentin',
  '300093715947': 'gabapentin',
};

// Try to match drug from barcode
const matchDrugFromBarcode = (barcode: string): string | null => {
  // Direct NDC match
  if (NDC_TO_DRUG[barcode]) {
    return NDC_TO_DRUG[barcode];
  }
  
  // Try partial NDC match (first 9 digits)
  const partialNDC = barcode.substring(0, 9);
  for (const [ndc, drug] of Object.entries(NDC_TO_DRUG)) {
    if (ndc.replace(/-/g, '').startsWith(partialNDC.replace(/-/g, ''))) {
      return drug;
    }
  }
  
  // Try UPC match
  if (NDC_TO_DRUG[barcode]) {
    return NDC_TO_DRUG[barcode];
  }
  
  return null;
};

const DrugInteractionScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [availableDrugs, setAvailableDrugs] = useState<string[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableDrugs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = availableDrugs.filter(drug =>
        drug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrugs(filtered);
    } else {
      setFilteredDrugs([]);
    }
  }, [searchQuery, availableDrugs]);

  const loadAvailableDrugs = async () => {
    try {
      const response = await drugInteractionsAPI.getAvailableDrugs();
      setAvailableDrugs(response.data.result || []);
    } catch (error) {
      console.error('Failed to load drugs:', error);
    }
  };

  const addDrug = (drug: string) => {
    if (!selectedDrugs.includes(drug)) {
      setSelectedDrugs([...selectedDrugs, drug]);
    }
    setSearchQuery('');
    setFilteredDrugs([]);
  };

  const removeDrug = (drug: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
    setAssessment(null);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in Settings to scan medication barcodes.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setScanned(false);
    setLastScannedCode(null);
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setLastScannedCode(data);
    
    const matchedDrug = matchDrugFromBarcode(data);
    
    if (matchedDrug) {
      if (selectedDrugs.includes(matchedDrug)) {
        Alert.alert(
          'Already Added',
          `${matchedDrug} is already in your medication list.`,
          [
            { text: 'Scan Another', onPress: () => setScanned(false) },
            { text: 'Done', onPress: () => setShowScanner(false) },
          ]
        );
      } else {
        Alert.alert(
          'Medication Found',
          `Found: ${matchedDrug}\n\nAdd to your medication list?`,
          [
            { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' },
            { 
              text: 'Add', 
              onPress: () => {
                addDrug(matchedDrug);
                Alert.alert(
                  'Added',
                  `${matchedDrug} has been added to your list.`,
                  [
                    { text: 'Scan Another', onPress: () => setScanned(false) },
                    { text: 'Done', onPress: () => setShowScanner(false) },
                  ]
                );
              }
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Unknown Barcode',
        `Barcode: ${data}\n\nThis medication is not in our database. You can add it manually.`,
        [
          { text: 'Scan Another', onPress: () => setScanned(false) },
          { text: 'Add Manually', onPress: () => setShowScanner(false) },
        ]
      );
    }
  };

  const checkInteractions = async () => {
    if (selectedDrugs.length < 2) {
      Alert.alert('Info', 'Please add at least 2 drugs to check interactions.');
      return;
    }

    setLoading(true);
    try {
      const response = await drugInteractionsAPI.assessRegimen(selectedDrugs);
      setAssessment(response.data.result);
    } catch (error) {
      Alert.alert('Error', 'Failed to check interactions.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'major': return '#ff8800';
      case 'moderate': return '#ffcc00';
      case 'minor': return '#00C896';
      default: return '#888';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ff4444';
      case 'moderate': return '#ff8800';
      case 'low': return '#00C896';
      default: return '#888';
    }
  };

  const renderInteraction = (interaction: DrugInteraction, index: number) => (
    <View key={index} style={styles.interactionCard}>
      <View style={styles.interactionHeader}>
        <View style={styles.drugPair}>
          <Text style={styles.drugName}>{interaction.drug1}</Text>
          <Ionicons name="swap-horizontal" size={16} color="#888" />
          <Text style={styles.drugName}>{interaction.drug2}</Text>
        </View>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(interaction.severity) }
        ]}>
          <Text style={styles.severityText}>{interaction.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.interactionDetails}>
        <Text style={styles.detailLabel}>Mechanism:</Text>
        <Text style={styles.detailText}>{interaction.mechanism}</Text>
        
        <Text style={styles.detailLabel}>Clinical Effect:</Text>
        <Text style={styles.detailText}>{interaction.clinicalEffect}</Text>
        
        <Text style={styles.detailLabel}>Recommendation:</Text>
        <Text style={[styles.detailText, styles.recommendationText]}>
          {interaction.recommendation}
        </Text>
        
        <View style={styles.evidenceRow}>
          <Ionicons name="document-text" size={12} color="#888" />
          <Text style={styles.evidenceText}>Evidence: {interaction.evidence}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="medical" size={32} color="#00C896" />
          <Text style={styles.title}>Drug Interactions</Text>
          <Text style={styles.subtitle}>Check for potential drug-drug interactions</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Add Medications</Text>
          
          {/* Scan Button */}
          <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
            <Ionicons name="barcode-outline" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Medication Barcode</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or search manually</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search medications..."
              placeholderTextColor="#666"
            />
          </View>

          {filteredDrugs.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredDrugs.slice(0, 5).map((drug, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => addDrug(drug)}
                >
                  <Text style={styles.suggestionText}>{drug}</Text>
                  <Ionicons name="add-circle" size={20} color="#00C896" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedDrugs.length > 0 && (
            <View style={styles.selectedDrugsContainer}>
              <Text style={styles.selectedLabel}>Selected Medications:</Text>
              <View style={styles.drugChips}>
                {selectedDrugs.map((drug, index) => (
                  <View key={index} style={styles.drugChip}>
                    <Text style={styles.drugChipText}>{drug}</Text>
                    <TouchableOpacity onPress={() => removeDrug(drug)}>
                      <Ionicons name="close-circle" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.checkButton,
              (loading || selectedDrugs.length < 2) && styles.checkButtonDisabled
            ]}
            onPress={checkInteractions}
            disabled={loading || selectedDrugs.length < 2}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.checkButtonText}>Check Interactions</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {assessment && (
          <View style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <Text style={styles.sectionTitle}>Risk Assessment</Text>
              <View style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor(assessment.overallRisk) }
              ]}>
                <Text style={styles.riskText}>
                  {assessment.overallRisk.toUpperCase()} RISK
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Side Effect Risk</Text>
                <Text style={styles.metricValue}>
                  {(assessment.sideEffectRisk * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Metabolic Load</Text>
                <Text style={styles.metricValue}>
                  {(assessment.metabolicLoad * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            {assessment.interactions.length > 0 && (
              <View style={styles.interactionsSection}>
                <Text style={styles.subsectionTitle}>
                  Interactions Found ({assessment.interactions.length})
                </Text>
                {assessment.interactions.map(renderInteraction)}
              </View>
            )}

            {assessment.recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <Text style={styles.subsectionTitle}>Recommendations</Text>
                {assessment.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons 
                      name={rec.startsWith('CRITICAL') ? 'alert-circle' : 'information-circle'} 
                      size={16} 
                      color={rec.startsWith('CRITICAL') ? '#ff4444' : '#00C896'} 
                    />
                    <Text style={styles.recommendationItemText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {assessment.alternatives.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.subsectionTitle}>Suggested Alternatives</Text>
                {assessment.alternatives.map((alt, index) => (
                  <View key={index} style={styles.alternativeItem}>
                    <View style={styles.alternativeHeader}>
                      <Text style={styles.currentDrug}>{alt.current}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#00C896" />
                      <Text style={styles.alternativeDrug}>{alt.alternative}</Text>
                    </View>
                    <Text style={styles.alternativeReason}>{alt.reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color="#888" />
          <Text style={styles.disclaimerText}>
            This tool is for informational purposes only. Always consult with a healthcare 
            provider or pharmacist before making changes to your medication regimen.
          </Text>
        </View>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Medication Barcode</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'codabar', 'itf14', 'datamatrix'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            
            {/* Scanner overlay */}
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </View>

          <View style={styles.scannerInstructions}>
            <Ionicons name="barcode-outline" size={40} color="#00C896" />
            <Text style={styles.instructionText}>
              Position the barcode within the frame
            </Text>
            <Text style={styles.instructionSubtext}>
              Supports NDC, UPC, and QR codes on medication packaging
            </Text>
            
            {lastScannedCode && (
              <View style={styles.lastScannedContainer}>
                <Text style={styles.lastScannedLabel}>Last scanned:</Text>
                <Text style={styles.lastScannedCode}>{lastScannedCode}</Text>
              </View>
            )}
          </View>

          {scanned && (
            <TouchableOpacity 
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.rescanButtonText}>Scan Another</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1a',
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
  },
  searchCard: {
    backgroundColor: '#141b2d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a3548',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2738',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#1e2738',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3548',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
  },
  selectedDrugsContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  drugChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  drugChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2738',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  drugChipText: {
    color: '#fff',
    fontSize: 14,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C896',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  checkButtonDisabled: {
    backgroundColor: '#2a3548',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  assessmentCard: {
    backgroundColor: '#141b2d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#1e2738',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  interactionsSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  interactionCard: {
    backgroundColor: '#1e2738',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drugPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drugName: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  interactionDetails: {
    gap: 8,
  },
  detailLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationText: {
    color: '#ffcc00',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  evidenceText: {
    color: '#666',
    fontSize: 11,
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  recommendationItemText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  alternativesSection: {
    marginBottom: 8,
  },
  alternativeItem: {
    backgroundColor: '#1e2738',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentDrug: {
    color: '#ff8800',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeDrug: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeReason: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    backgroundColor: '#141b2d',
    borderRadius: 12,
    marginBottom: 32,
  },
  disclaimerText: {
    flex: 1,
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0f1a',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.5,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00C896',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerInstructions: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#0a0f1a',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  lastScannedContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1e2738',
    borderRadius: 8,
    alignItems: 'center',
  },
  lastScannedLabel: {
    color: '#888',
    fontSize: 12,
  },
  lastScannedCode: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C896',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DrugInteractionScreen;
