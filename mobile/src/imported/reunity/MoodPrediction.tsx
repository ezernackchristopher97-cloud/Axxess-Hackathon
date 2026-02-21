import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface WearableData {
  heartRateVariability: number;
  restingHeartRate: number;
  sleepQuality: number;
  stressLevel: number;
  steps: number;
  activeMinutes: number;
  lastSync: number;
}

interface PredictionResult {
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  confidence: number;
  factors: PredictionFactor[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

interface PredictionFactor {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

interface MoodPredictionProps {
  onHighRiskDetected?: () => void;
  compact?: boolean;
}

const RISK_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  elevated: '#f97316',
  high: '#ef4444',
};

const RISK_ICONS = {
  low: 'shield-checkmark',
  moderate: 'alert-circle',
  elevated: 'warning',
  high: 'alert',
};

function calculatePrediction(data: WearableData | null, journalSentiment: number = 0): PredictionResult {
  const factors: PredictionFactor[] = [];
  let riskScore = 0;
  
  if (data) {
    // HRV Factor (lower HRV = higher stress)
    const hrvNormalized = Math.min(100, Math.max(0, (data.heartRateVariability - 20) / 60 * 100));
    const hrvImpact = hrvNormalized < 40 ? 'negative' : hrvNormalized > 60 ? 'positive' : 'neutral';
    factors.push({
      name: 'Heart Rate Variability',
      value: hrvNormalized,
      impact: hrvImpact,
      weight: 0.3,
    });
    riskScore += (100 - hrvNormalized) * 0.3;
    
    // Sleep Quality Factor
    const sleepImpact = data.sleepQuality < 50 ? 'negative' : data.sleepQuality > 70 ? 'positive' : 'neutral';
    factors.push({
      name: 'Sleep Quality',
      value: data.sleepQuality,
      impact: sleepImpact,
      weight: 0.25,
    });
    riskScore += (100 - data.sleepQuality) * 0.25;
    
    // Resting Heart Rate Factor (higher = more stress)
    const rhrNormalized = Math.min(100, Math.max(0, (data.restingHeartRate - 50) / 40 * 100));
    const rhrImpact = rhrNormalized > 60 ? 'negative' : rhrNormalized < 40 ? 'positive' : 'neutral';
    factors.push({
      name: 'Resting Heart Rate',
      value: rhrNormalized,
      impact: rhrImpact,
      weight: 0.2,
    });
    riskScore += rhrNormalized * 0.2;
    
    // Stress Level Factor
    const stressImpact = data.stressLevel > 60 ? 'negative' : data.stressLevel < 40 ? 'positive' : 'neutral';
    factors.push({
      name: 'Stress Level',
      value: data.stressLevel,
      impact: stressImpact,
      weight: 0.25,
    });
    riskScore += data.stressLevel * 0.25;
  }
  
  // Journal Sentiment Factor
  if (journalSentiment !== 0) {
    const sentimentNormalized = ((journalSentiment + 1) / 2) * 100;
    const sentimentImpact = sentimentNormalized < 40 ? 'negative' : sentimentNormalized > 60 ? 'positive' : 'neutral';
    factors.push({
      name: 'Journal Sentiment',
      value: sentimentNormalized,
      impact: sentimentImpact,
      weight: 0.2,
    });
    riskScore += (100 - sentimentNormalized) * 0.2;
  }
  
  // Determine risk level
  let riskLevel: PredictionResult['riskLevel'];
  if (riskScore < 30) riskLevel = 'low';
  else if (riskScore < 50) riskLevel = 'moderate';
  else if (riskScore < 70) riskLevel = 'elevated';
  else riskLevel = 'high';
  
  // Calculate confidence
  const confidence = Math.min(95, 60 + factors.length * 7);
  
  // Generate recommendations
  const recommendations: string[] = [];
  factors.forEach(factor => {
    if (factor.impact === 'negative') {
      switch (factor.name) {
        case 'Heart Rate Variability':
          recommendations.push('Try deep breathing exercises to improve HRV');
          break;
        case 'Sleep Quality':
          recommendations.push('Establish a consistent sleep schedule');
          break;
        case 'Resting Heart Rate':
          recommendations.push('Consider light exercise or meditation');
          break;
        case 'Stress Level':
          recommendations.push('Take breaks and practice grounding techniques');
          break;
        case 'Journal Sentiment':
          recommendations.push('Reach out to a trusted person or therapist');
          break;
      }
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('Keep up your healthy habits!');
  }
  
  return {
    riskLevel,
    confidence,
    factors,
    recommendations,
    trend: 'stable',
  };
}

export default function MoodPrediction({ onHighRiskDetected, compact = false }: MoodPredictionProps) {
  const [wearableData, setWearableData] = useState<WearableData | null>(null);
  const [journalSentiment, setJournalSentiment] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load wearable data
      const wearableStored = await AsyncStorage.getItem('reunity_wearable_data');
      if (wearableStored) {
        setWearableData(JSON.parse(wearableStored));
      } else {
        // Mock data for demo
        setWearableData({
          heartRateVariability: 45,
          restingHeartRate: 68,
          sleepQuality: 72,
          stressLevel: 35,
          steps: 8500,
          activeMinutes: 45,
          lastSync: Date.now(),
        });
      }
      
      // Load journal sentiment
      const journalStored = await AsyncStorage.getItem('reunity_journal_entries');
      if (journalStored) {
        const entries = JSON.parse(journalStored);
        if (entries.length > 0) {
          const recentEntries = entries.slice(0, 7);
          const avgSentiment = recentEntries.reduce((sum: number, e: any) => sum + (e.sentiment?.score || 0), 0) / recentEntries.length;
          setJournalSentiment(avgSentiment);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const prediction = useMemo(() => {
    return calculatePrediction(wearableData, journalSentiment);
  }, [wearableData, journalSentiment]);

  useEffect(() => {
    if (prediction.riskLevel === 'high' && onHighRiskDetected) {
      onHighRiskDetected();
    }
  }, [prediction.riskLevel, onHighRiskDetected]);

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { borderColor: RISK_COLORS[prediction.riskLevel] + '50' }]}
        onPress={() => setShowDetails(true)}
      >
        <View style={[styles.compactIcon, { backgroundColor: RISK_COLORS[prediction.riskLevel] + '20' }]}>
          <Ionicons 
            name={RISK_ICONS[prediction.riskLevel] as any} 
            size={24} 
            color={RISK_COLORS[prediction.riskLevel]} 
          />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle}>Mood Prediction</Text>
          <Text style={[styles.compactRisk, { color: RISK_COLORS[prediction.riskLevel] }]}>
            {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)} Risk
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Prediction Card */}
      <View style={[styles.mainCard, { borderColor: RISK_COLORS[prediction.riskLevel] + '50' }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="analytics" size={20} color="#10b981" />
            <Text style={styles.title}>Mood Prediction</Text>
          </View>
          <Text style={styles.confidence}>{prediction.confidence}% confidence</Text>
        </View>

        {/* Risk Level Display */}
        <View style={styles.riskDisplay}>
          <View style={[styles.riskIcon, { backgroundColor: RISK_COLORS[prediction.riskLevel] + '20' }]}>
            <Ionicons 
              name={RISK_ICONS[prediction.riskLevel] as any} 
              size={32} 
              color={RISK_COLORS[prediction.riskLevel]} 
            />
          </View>
          <View style={styles.riskInfo}>
            <Text style={[styles.riskLevel, { color: RISK_COLORS[prediction.riskLevel] }]}>
              {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)} Risk
            </Text>
            <Text style={styles.riskDesc}>
              {prediction.riskLevel === 'low' && 'Your wellness indicators look good'}
              {prediction.riskLevel === 'moderate' && 'Some indicators suggest mild stress'}
              {prediction.riskLevel === 'elevated' && 'Multiple indicators suggest increased stress'}
              {prediction.riskLevel === 'high' && 'Please consider reaching out for support'}
            </Text>
          </View>
        </View>

        {/* Risk Meter */}
        <View style={styles.meterContainer}>
          <View style={styles.meterTrack}>
            <View 
              style={[
                styles.meterFill, 
                { 
                  width: `${prediction.riskLevel === 'low' ? 25 : prediction.riskLevel === 'moderate' ? 50 : prediction.riskLevel === 'elevated' ? 75 : 100}%`,
                  backgroundColor: RISK_COLORS[prediction.riskLevel]
                }
              ]} 
            />
          </View>
          <View style={styles.meterLabels}>
            <Text style={styles.meterLabel}>Low</Text>
            <Text style={styles.meterLabel}>Moderate</Text>
            <Text style={styles.meterLabel}>Elevated</Text>
            <Text style={styles.meterLabel}>High</Text>
          </View>
        </View>

        {/* High Risk Alert */}
        {prediction.riskLevel === 'high' && (
          <View style={styles.alertBox}>
            <Ionicons name="heart" size={20} color="#ef4444" />
            <Text style={styles.alertText}>
              We're here for you. Consider reaching out to someone you trust.
            </Text>
            <TouchableOpacity
              style={styles.crisisButton}
              onPress={() => Linking.openURL('tel:988')}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.crisisText}>Call 988</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Factors */}
      <View style={styles.factorsCard}>
        <Text style={styles.sectionTitle}>Contributing Factors</Text>
        {prediction.factors.map((factor, idx) => (
          <View key={idx} style={styles.factorRow}>
            <View style={styles.factorInfo}>
              <Ionicons 
                name={factor.impact === 'positive' ? 'arrow-up-circle' : factor.impact === 'negative' ? 'arrow-down-circle' : 'remove-circle'} 
                size={16} 
                color={factor.impact === 'positive' ? '#10b981' : factor.impact === 'negative' ? '#ef4444' : '#71717a'} 
              />
              <Text style={styles.factorName}>{factor.name}</Text>
            </View>
            <View style={styles.factorBar}>
              <View 
                style={[
                  styles.factorFill, 
                  { 
                    width: `${factor.value}%`,
                    backgroundColor: factor.impact === 'positive' ? '#10b981' : factor.impact === 'negative' ? '#ef4444' : '#71717a'
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {prediction.recommendations.map((rec, idx) => (
          <View key={idx} style={styles.recRow}>
            <Ionicons name="sparkles" size={16} color="#10b981" />
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  confidence: {
    fontSize: 12,
    color: '#71717a',
  },
  riskDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  riskIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskInfo: {
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: '700',
  },
  riskDesc: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  meterContainer: {
    marginTop: 8,
  },
  meterTrack: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  meterLabel: {
    fontSize: 10,
    color: '#71717a',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  alertText: {
    flex: 1,
    color: '#fca5a5',
    fontSize: 14,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  crisisText: {
    color: '#fff',
    fontWeight: '600',
  },
  factorsCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  factorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '40%',
  },
  factorName: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  factorBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    marginLeft: 12,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  recText: {
    flex: 1,
    color: '#d4d4d8',
    fontSize: 14,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  compactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  compactRisk: {
    fontSize: 18,
    fontWeight: '600',
  },
});
