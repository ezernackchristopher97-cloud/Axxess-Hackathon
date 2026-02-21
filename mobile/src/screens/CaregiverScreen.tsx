import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';

interface CaregiverAlert {
  id: string;
  type: 'risk' | 'medication' | 'freeze' | 'fall' | 'mood' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface CaregiverContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  notifyOnHighRisk: boolean;
}

const DEMO_CONTACTS: CaregiverContact[] = [
  {
    id: '1',
    name: 'Sarah Ezernack',
    relationship: 'Spouse / Primary Caregiver',
    phone: '(318) 555-0142',
    isPrimary: true,
    notifyOnHighRisk: true,
  },
  {
    id: '2',
    name: 'Dr. Sarah Chen',
    relationship: 'Neurologist',
    phone: '(214) 555-0198',
    isPrimary: false,
    notifyOnHighRisk: true,
  },
  {
    id: '3',
    name: 'James Ezernack',
    relationship: 'Brother',
    phone: '(318) 555-0267',
    isPrimary: false,
    notifyOnHighRisk: false,
  },
];

const DEMO_ALERTS: CaregiverAlert[] = [
  {
    id: '1',
    type: 'risk',
    severity: 'warning',
    title: 'Elevated Flare Risk',
    message: 'Stability score dropped to 58/100. Tremor intensity increased over the past 2 hours. Monitor closely.',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    acknowledged: false,
  },
  {
    id: '2',
    type: 'medication',
    severity: 'info',
    title: 'Medication Taken',
    message: 'Carbidopa-Levodopa 25/100mg taken at 11:02 AM (2 minutes late).',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    acknowledged: true,
  },
  {
    id: '3',
    type: 'freeze',
    severity: 'critical',
    title: 'Freeze Episode Detected',
    message: 'Freeze episode reported at kitchen doorway. Duration: ~45 seconds. Patient recovered independently.',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    acknowledged: true,
  },
  {
    id: '4',
    type: 'mood',
    severity: 'info',
    title: 'Mood Check-In Complete',
    message: 'Patient reported mood as "okay" with mild anxiety. Sleep quality last night: 5/10.',
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    acknowledged: true,
  },
  {
    id: '5',
    type: 'system',
    severity: 'info',
    title: 'Daily Summary Available',
    message: 'Yesterday\'s summary: 1 freeze episode, 3/4 medications on time, stability score avg 62/100.',
    timestamp: new Date(Date.now() - 720 * 60000).toISOString(),
    acknowledged: true,
  },
];

export default function CaregiverScreen() {
  const { isDemoMode } = useDemoMode();
  const [alerts, setAlerts] = useState<CaregiverAlert[]>(DEMO_ALERTS);
  const [contacts] = useState<CaregiverContact[]>(DEMO_CONTACTS);
  const [showSimulatePanel, setShowSimulatePanel] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const hasUnacknowledged = alerts.some(a => !a.acknowledged && a.severity === 'critical');
    if (hasUnacknowledged) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [alerts]);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const simulateFlareAlert = () => {
    const newAlert: CaregiverAlert = {
      id: Date.now().toString(),
      type: 'risk',
      severity: 'critical',
      title: 'FLARE RISK THRESHOLD CROSSED',
      message: 'Stability score dropped below 40/100. Tremor intensity: HIGH. Freeze risk: ELEVATED. Caregiver notification sent. Recommend immediate check-in.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
    Alert.alert(
      'Alert Triggered',
      'Flare risk threshold crossed. In production, this would send a push notification to all caregivers with high-risk alerts enabled.',
      [{ text: 'OK' }]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'warning': return colors.warning;
      default: return colors.info;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk': return '⚠';
      case 'medication': return '💊';
      case 'freeze': return '🧊';
      case 'fall': return '🚨';
      case 'mood': return '🧠';
      default: return '📋';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Caregiver Dashboard</Text>
          <Text style={styles.statusSubtitle}>
            {unacknowledgedCount > 0
              ? `${unacknowledgedCount} unacknowledged alert${unacknowledgedCount > 1 ? 's' : ''}`
              : 'All alerts acknowledged'}
          </Text>
        </View>

        {/* Simulate Button */}
        <TouchableOpacity style={styles.simulateButton} onPress={simulateFlareAlert}>
          <Text style={styles.simulateButtonText}>Simulate Flare Risk Alert</Text>
          <Text style={styles.simulateSubtext}>Triggers caregiver notification</Text>
        </TouchableOpacity>

        {/* Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Team</Text>
          {contacts.map(contact => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelation}>{contact.relationship}</Text>
                </View>
                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <View style={styles.contactFooter}>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                {contact.notifyOnHighRisk && (
                  <Text style={styles.notifyText}>High-risk alerts ON</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Alert Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Feed</Text>
          {alerts.map(alert => (
            <Animated.View
              key={alert.id}
              style={[
                styles.alertCard,
                {
                  borderLeftColor: getSeverityColor(alert.severity),
                  opacity: alert.acknowledged ? 0.7 : 1,
                  transform: !alert.acknowledged && alert.severity === 'critical'
                    ? [{ scale: pulseAnim }]
                    : [],
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{getTypeIcon(alert.type)}</Text>
                <View style={styles.alertHeaderText}>
                  <Text style={[styles.alertTitle, { color: getSeverityColor(alert.severity) }]}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                </View>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              {!alert.acknowledged && (
                <TouchableOpacity
                  style={styles.acknowledgeButton}
                  onPress={() => acknowledgeAlert(alert.id)}
                >
                  <Text style={styles.acknowledgeText}>Acknowledge</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}
        </View>
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
  statusCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  simulateButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  simulateButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  simulateSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  contactCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  contactName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  contactRelation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  primaryBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  primaryBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: 'bold',
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactPhone: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  notifyText: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
  alertCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  acknowledgeButton: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  acknowledgeText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
