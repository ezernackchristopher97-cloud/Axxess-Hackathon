import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';

interface ConditionProfile {
  name: string;
  dateOfBirth: string;
  diagnosis: string;
  diagnosisDate: string;
  stage: string;
  symptoms: string[];
  medications: Array<{ name: string; dosage: string; frequency: string; time: string }>;
  allergies: string[];
  emergencyNotes: string;
  primaryCaregiver: string;
  caregiverPhone: string;
  neurologist: string;
  neurologistPhone: string;
}

const DEMO_PROFILE: ConditionProfile = {
  name: '',
  dateOfBirth: '',
  diagnosis: '',
  diagnosisDate: '',
  stage: '',
  symptoms: [],
  medications: [],
  allergies: [],
  emergencyNotes: '',
  primaryCaregiver: '',
  caregiverPhone: '',
  neurologist: '',
  neurologistPhone: '',
};

export default function PatientProfileScreen() {
  const { isDemoMode } = useDemoMode();
  const navigation = useNavigation<any>();
  const [profile] = useState<ConditionProfile>(DEMO_PROFILE);
  const [editMode, setEditMode] = useState(false);

  const getSeverityColor = (index: number) => {
    const severityColors = [colors.error, colors.warning, colors.warning, colors.info, colors.info, colors.success, colors.success];
    return severityColors[index % severityColors.length];
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.patientName}>{profile.name}</Text>
          <Text style={styles.diagnosisText}>{profile.diagnosis}</Text>
          <Text style={styles.stageText}>{profile.stage}</Text>
        </View>

        {/* Diagnosis Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diagnosis Date</Text>
            <Text style={styles.infoValue}>{profile.diagnosisDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Diagnosis</Text>
            <Text style={styles.infoValue}>{profile.diagnosis}</Text>
          </View>
        </View>

        {/* Active Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Symptoms</Text>
          {profile.symptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomRow}>
              <View style={[styles.symptomDot, { backgroundColor: getSeverityColor(index) }]} />
              <Text style={styles.symptomText}>{symptom}</Text>
            </View>
          ))}
        </View>

        {/* Current Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          {profile.medications.map((med, index) => (
            <View key={index} style={styles.medCard}>
              <View style={styles.medHeader}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDosage}>{med.dosage}</Text>
              </View>
              <Text style={styles.medSchedule}>
                {med.frequency}, {med.time}
              </Text>
            </View>
          ))}
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <View style={styles.allergyRow}>
            {profile.allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyBadge}>
                <Text style={styles.allergyText}>{allergy}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Notes</Text>
          <View style={styles.emergencyBox}>
            <Text style={styles.emergencyText}>{profile.emergencyNotes}</Text>
          </View>
        </View>

        {/* Care Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Team</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactRole}>Primary Caregiver</Text>
            <Text style={styles.contactName}>{profile.primaryCaregiver}</Text>
            <Text style={styles.contactPhone}>{profile.caregiverPhone}</Text>
          </View>
          <View style={styles.contactCard}>
            <Text style={styles.contactRole}>Neurologist</Text>
            <Text style={styles.contactName}>{profile.neurologist}</Text>
            <Text style={styles.contactPhone}>{profile.neurologistPhone}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VisitSummary')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Visit Summary Generator</Text>
              <Text style={styles.actionSubtitle}>Convert visit notes to structured + patient-friendly summaries</Text>
            </View>
            <Text style={styles.actionArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Demo Mode toggle, architecture details, about</Text>
            </View>
            <Text style={styles.actionArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Exists</Text>
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>
              NeuroSync Care bridges the gap between patient, caregiver, clinician, 
              and first responder for any neurological condition. It ensures continuity 
              of care across every interaction, from daily monitoring to emergency response.
            </Text>
          </View>
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
  demoBannerText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: fontSize.xs,
  },
  scrollContent: { padding: spacing.md },
  headerCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.background,
  },
  patientName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  diagnosisText: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  stageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  symptomDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  symptomText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  medCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  medName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  medDosage: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  medSchedule: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  allergyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergyBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error,
  },
  allergyText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emergencyBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  emergencyText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactRole: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  contactName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contactPhone: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  aboutBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
