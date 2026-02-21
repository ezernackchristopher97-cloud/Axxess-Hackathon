import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';
import {
  computeShannonEntropy,
  computeSampleEntropy,
  computeVicsekOrder,
  applyL1CoherenceFilter,
  applyL2StabilityFilter,
  computeAbsurdityScore,
  detectRegime,
  entropyToColor,
} from '../imported/neural-entropy/BoraFramework';
import { getRiskAssessment } from '../services/featherless';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SymptomInput {
  tremor: number;
  freezing: number;
  sleep: number;
  mood: number;
  mobility: number;
}

const SYMPTOM_LABELS: Record<keyof SymptomInput, string> = {
  tremor: 'Motor Symptom Intensity',
  freezing: 'Episode Frequency',
  sleep: 'Sleep Quality',
  mood: 'Mood / Wellbeing',
  mobility: 'Mobility',
};

export default function RiskScoreScreen() {
  const { isDemoMode } = useDemoMode();
  const [symptoms, setSymptoms] = useState<SymptomInput>({
    tremor: 0,
    freezing: 0,
    sleep: 0.5,
    mood: 0.5,
    mobility: 0.5,
  });
  const [riskData, setRiskData] = useState<{
    score: number;
    level: 'low' | 'moderate' | 'elevated' | 'high';
    factors: string[];
    trend: number[];
  } | null>(null);
  const [entropyMetrics, setEntropyMetrics] = useState<{
    shannon: number;
    sample: number;
    vicsekOrder: number;
    regime: string;
    l1: { passed: boolean; score: number; details: string };
    l2: { passed: boolean; score: number; details: string };
    absurdity: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    computeRisk();
  }, [symptoms]);

  const computeRisk = async () => {
    setLoading(true);
    try {
      // Compute entropy metrics using BoraFramework
      const signalData = Object.values(symptoms).map(v => v * 100);
      // Generate a longer signal for meaningful entropy computation
      const extendedSignal: number[] = [];
      for (let i = 0; i < 50; i++) {
        const noise = (Math.random() - 0.5) * 10;
        const idx = i % signalData.length;
        extendedSignal.push(signalData[idx] + noise + Math.sin(i * 0.3) * 5);
      }

      const shannon = computeShannonEntropy(extendedSignal.map(v => Math.max(0, v)));
      const sample = computeSampleEntropy(extendedSignal);
      const velocities = extendedSignal.map((v, i) => ({
        vx: Math.cos(i * 0.5) * v,
        vy: Math.sin(i * 0.5) * v,
      }));
      const vicsekOrder = computeVicsekOrder(velocities);
      const l1 = applyL1CoherenceFilter(extendedSignal.map(v => Math.max(0, v)));
      const l2 = applyL2StabilityFilter(extendedSignal);
      const absurdity = computeAbsurdityScore(shannon, vicsekOrder, l1, l2);
      const regime = detectRegime(shannon, vicsekOrder);

      setEntropyMetrics({ shannon, sample, vicsekOrder, regime, l1, l2, absurdity });

      // Get risk assessment
      const risk = await getRiskAssessment(isDemoMode, symptoms as unknown as Record<string, number>);
      setRiskData(risk);
    } catch (error) {
      console.error('Risk computation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'low': return colors.success;
      case 'moderate': return colors.warning;
      case 'elevated': return '#f97316';
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderTrendBar = (values: number[]) => {
    const maxVal = Math.max(...values, 1);
    const barWidth = (SCREEN_WIDTH - 80) / values.length - 4;
    return (
      <View style={styles.trendContainer}>
        {values.map((val, i) => (
          <View key={i} style={styles.trendBarWrapper}>
            <View
              style={[
                styles.trendBar,
                {
                  height: Math.max(4, (val / maxVal) * 80),
                  width: barWidth,
                  backgroundColor: val > 0.6 ? colors.error : val > 0.4 ? colors.warning : colors.success,
                },
              ]}
            />
            <Text style={styles.trendLabel}>{(i - values.length + 1 === 0) ? 'Now' : `${i - values.length + 1}d`}</Text>
          </View>
        ))}
      </View>
    );
  };

  const adjustSymptom = (key: keyof SymptomInput, delta: number) => {
    setSymptoms(prev => ({
      ...prev,
      [key]: Math.min(1, Math.max(0, prev[key] + delta)),
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE — Entropy Scoring Model</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Risk Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Today's Stability Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getRiskColor(riskData?.level) }]}>
              {riskData ? Math.round((1 - riskData.score) * 100) : '--'}
            </Text>
            <Text style={styles.scoreUnit}>/ 100</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: getRiskColor(riskData?.level) + '30' }]}>
            <Text style={[styles.levelText, { color: getRiskColor(riskData?.level) }]}>
              {riskData?.level?.toUpperCase() || 'CALCULATING'}
            </Text>
          </View>
        </View>

        {/* 7-Day Trend */}
        {riskData?.trend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Trend</Text>
            {renderTrendBar(riskData.trend)}
          </View>
        )}

        {/* Entropy Metrics */}
        {entropyMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Neural Entropy Analysis</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{entropyMetrics.shannon.toFixed(3)}</Text>
                <Text style={styles.metricLabel}>Shannon Entropy</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{entropyMetrics.sample.toFixed(3)}</Text>
                <Text style={styles.metricLabel}>Sample Entropy</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{entropyMetrics.vicsekOrder.toFixed(3)}</Text>
                <Text style={styles.metricLabel}>Vicsek Order</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{entropyMetrics.absurdity.toFixed(3)}</Text>
                <Text style={styles.metricLabel}>Absurdity Score</Text>
              </View>
            </View>
            <View style={styles.regimeBadge}>
              <Text style={styles.regimeText}>
                Regime: {entropyMetrics.regime.toUpperCase()}
              </Text>
            </View>
            <View style={styles.filterResults}>
              <View style={[styles.filterRow, { borderLeftColor: entropyMetrics.l1.passed ? colors.success : colors.error }]}>
                <Text style={styles.filterText}>{entropyMetrics.l1.details}</Text>
              </View>
              <View style={[styles.filterRow, { borderLeftColor: entropyMetrics.l2.passed ? colors.success : colors.error }]}>
                <Text style={styles.filterText}>{entropyMetrics.l2.details}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Contributing Factors */}
        {riskData?.factors && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contributing Factors</Text>
            {riskData.factors.map((factor, index) => (
              <View key={index} style={styles.factorRow}>
                <Text style={styles.factorBullet}>{'>'}</Text>
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Symptom Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Check-In</Text>
          <Text style={styles.sectionSubtitle}>Adjust to update your risk score</Text>
          {(Object.keys(symptoms) as Array<keyof SymptomInput>).map(key => (
            <View key={key} style={styles.symptomRow}>
              <Text style={styles.symptomLabel}>{SYMPTOM_LABELS[key]}</Text>
              <View style={styles.symptomControls}>
                <TouchableOpacity
                  style={styles.symptomButton}
                  onPress={() => adjustSymptom(key, -0.1)}
                >
                  <Text style={styles.symptomButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.symptomBarContainer}>
                  <View
                    style={[
                      styles.symptomBar,
                      {
                        width: `${symptoms[key] * 100}%`,
                        backgroundColor: key === 'sleep' || key === 'mood' || key === 'mobility'
                          ? (symptoms[key] > 0.6 ? colors.success : symptoms[key] > 0.3 ? colors.warning : colors.error)
                          : (symptoms[key] > 0.6 ? colors.error : symptoms[key] > 0.3 ? colors.warning : colors.success),
                      },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={styles.symptomButton}
                  onPress={() => adjustSymptom(key, 0.1)}
                >
                  <Text style={styles.symptomButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={computeRisk}>
          <Text style={styles.refreshButtonText}>
            {loading ? 'Computing...' : 'Recalculate Risk Score'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { padding: spacing.md, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreUnit: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  levelBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  levelText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  trendBarWrapper: { alignItems: 'center' },
  trendBar: {
    borderRadius: 2,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  regimeBadge: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  regimeText: {
    fontSize: fontSize.sm,
    color: colors.info,
    fontWeight: '600',
  },
  filterResults: { marginTop: spacing.sm },
  filterRow: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
  },
  filterText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  factorRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  factorBullet: {
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  factorText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  symptomRow: {
    marginBottom: spacing.md,
  },
  symptomLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  symptomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  symptomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  symptomButtonText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: 'bold',
  },
  symptomBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  symptomBar: {
    height: '100%',
    borderRadius: 4,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  refreshButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
