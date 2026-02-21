import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { architectureApi, ArchitectureStats, UserProfile } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

export default function ArchitectureScreen() {
  const [stats, setStats] = useState<ArchitectureStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, profileResponse] = await Promise.all([
        architectureApi.getStats(),
        architectureApi.getUserProfile(),
      ]);

      if (statsResponse.result?.data?.json) {
        setStats(statsResponse.result.data.json);
      }
      if (profileResponse.result?.data?.json) {
        setUserProfile(profileResponse.result.data.json);
      }
    } catch (error) {
      console.error('Failed to load architecture data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await architectureApi.exportMetrics('markdown');
      if (response.result?.data?.json?.content) {
        await Share.share({
          message: response.result.data.json.content,
          title: 'AIModelG3 Architecture Metrics',
        });
      } else {
        Alert.alert('Export Failed', 'Could not generate metrics report.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting metrics.');
    } finally {
      setExporting(false);
    }
  };

  const StatCard = ({ 
    title, 
    icon, 
    children 
  }: { 
    title: string; 
    icon: string; 
    children: React.ReactNode;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );

  const StatRow = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}{unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
    </View>
  );

  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading architecture stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🧠 AIModelG3 Architecture</Text>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Text style={styles.exportButtonText}>📊 Export</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Real-time system monitoring and optimization stats
        </Text>
      </View>

      {/* Neural Pruning Stats */}
      <StatCard title="Neural Pruning" icon="🔗">
        {stats?.neural ? (
          <>
            <StatRow label="Total Synapses" value={stats.neural.totalSynapses.toLocaleString()} />
            <StatRow label="Active Synapses" value={stats.neural.activeSynapses.toLocaleString()} />
            <StatRow label="Pruned Synapses" value={stats.neural.prunedSynapses.toLocaleString()} />
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Synaptic Efficiency</Text>
              <ProgressBar 
                value={stats.neural.activeSynapses} 
                max={stats.neural.totalSynapses} 
                color={colors.primary} 
              />
              <Text style={styles.progressValue}>
                {Math.round((stats.neural.activeSynapses / stats.neural.totalSynapses) * 100)}%
              </Text>
            </View>
            <StatRow label="Average Weight" value={stats.neural.averageWeight.toFixed(3)} />
          </>
        ) : (
          <Text style={styles.noData}>No neural data available</Text>
        )}
      </StatCard>

      {/* Vicsek Consensus Stats */}
      <StatCard title="Vicsek Consensus" icon="🐦">
        {stats?.vicsek ? (
          <>
            <StatRow label="Order Parameter" value={stats.vicsek.orderParameter.toFixed(3)} />
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Consensus Strength</Text>
              <ProgressBar 
                value={stats.vicsek.orderParameter} 
                max={1} 
                color={stats.vicsek.orderParameter > 0.7 ? colors.success : colors.warning} 
              />
            </View>
            <StatRow label="Active Agents" value={stats.vicsek.agentCount} />
            <View style={styles.statusRow}>
              <Text style={styles.statLabel}>Consensus Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: stats.vicsek.consensusReached ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: stats.vicsek.consensusReached ? colors.success : colors.warning }
                ]}>
                  {stats.vicsek.consensusReached ? '✓ Reached' : '⏳ Converging'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noData}>No consensus data available</Text>
        )}
      </StatCard>

      {/* Entropy Mirroring Stats */}
      <StatCard title="Entropy Mirroring" icon="🪞">
        {stats?.entropy ? (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statLabel}>Entropy State</Text>
              <View style={[styles.statusBadge, styles.entropyBadge]}>
                <Text style={styles.entropyText}>{stats.entropy.currentState}</Text>
              </View>
            </View>
            <StatRow label="Average Entropy" value={stats.entropy.averageEntropy.toFixed(3)} />
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Mirroring Strength</Text>
              <ProgressBar 
                value={stats.entropy.mirroringStrength} 
                max={1} 
                color={colors.accent} 
              />
              <Text style={styles.progressValue}>
                {Math.round(stats.entropy.mirroringStrength * 100)}%
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.noData}>No entropy data available</Text>
        )}
      </StatCard>

      {/* Memory Optimization Stats */}
      <StatCard title="Memory Optimization" icon="💾">
        {stats?.memory ? (
          <>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Compression Ratio</Text>
              <ProgressBar 
                value={stats.memory.compressionRatio} 
                max={1} 
                color={colors.primary} 
              />
              <Text style={styles.progressValue}>
                {Math.round(stats.memory.compressionRatio * 100)}%
              </Text>
            </View>
            <StatRow label="Tokens Saved" value={stats.memory.savedTokens.toLocaleString()} />
          </>
        ) : (
          <Text style={styles.noData}>No memory data available</Text>
        )}
      </StatCard>

      {/* User Profile */}
      {userProfile && (
        <StatCard title="Your Profile" icon="👤">
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Formality</Text>
              <ProgressBar value={userProfile.formalityScore} max={1} color={colors.primary} />
              <Text style={styles.profileValue}>{Math.round(userProfile.formalityScore * 100)}%</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Verbosity</Text>
              <ProgressBar value={userProfile.verbosityScore} max={1} color={colors.accent} />
              <Text style={styles.profileValue}>{Math.round(userProfile.verbosityScore * 100)}%</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Technicality</Text>
              <ProgressBar value={userProfile.technicalityScore} max={1} color={colors.success} />
              <Text style={styles.profileValue}>{Math.round(userProfile.technicalityScore * 100)}%</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Emotionality</Text>
              <ProgressBar value={userProfile.emotionalityScore} max={1} color={colors.warning} />
              <Text style={styles.profileValue}>{Math.round(userProfile.emotionalityScore * 100)}%</Text>
            </View>
          </View>
          <View style={styles.profileMeta}>
            <StatRow label="Total Interactions" value={userProfile.totalInteractions} />
            <StatRow label="Entropy State" value={userProfile.entropyState} />
            <StatRow label="Mirroring Strength" value={`${Math.round(userProfile.mirroringStrength * 100)}%`} />
          </View>
        </StatCard>
      )}

      {/* Architecture Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About AIModelG3</Text>
        <Text style={styles.infoText}>
          AIModelG3 uses a novel architecture combining neural pruning, Vicsek model consensus, 
          and entropy-based mirroring to create more efficient and personalized AI interactions.
        </Text>
        <View style={styles.infoFeatures}>
          <View style={styles.infoFeature}>
            <Text style={styles.featureIcon}>🧬</Text>
            <Text style={styles.featureText}>Hebbian Learning</Text>
          </View>
          <View style={styles.infoFeature}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>Quaternion Encoding</Text>
          </View>
          <View style={styles.infoFeature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Geometric Optimization</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    flex: 1,
  },
  exportButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cardContent: {},
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statUnit: {
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  progressSection: {
    marginVertical: spacing.sm,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  entropyBadge: {
    backgroundColor: colors.accent + '20',
  },
  entropyText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noData: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  profileGrid: {
    marginBottom: spacing.md,
  },
  profileItem: {
    marginBottom: spacing.sm,
  },
  profileLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  profileValue: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  profileMeta: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoFeature: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  featureText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
