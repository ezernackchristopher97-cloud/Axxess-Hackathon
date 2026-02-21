import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';

interface EmergencyInfo {
  patientName: string;
  dateOfBirth: string;
  bloodType: string;
  diagnosis: string;
  allergies: string[];
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  emergencyContacts: Array<{ name: string; relationship: string; phone: string }>;
  criticalNotes: string[];
  doNotDo: string[];
  medicalFacility: string;
  medicalFacilityPhone: string;
  insuranceInfo: string;
}

const EMERGENCY_DATA: EmergencyInfo = {
  patientName: 'Christopher Ezernack',
  dateOfBirth: '1997-03-15',
  bloodType: 'O+',
  diagnosis: "Parkinson's Disease with Dystonia",
  allergies: ['Sulfa drugs', 'Codeine'],
  medications: [
    { name: 'Carbidopa-Levodopa', dosage: '25/100mg', frequency: 'QID' },
    { name: 'Pramipexole', dosage: '0.5mg', frequency: 'BID' },
    { name: 'Amantadine', dosage: '100mg', frequency: 'QD' },
  ],
  emergencyContacts: [
    { name: 'Sarah Ezernack', relationship: 'Spouse', phone: '(318) 555-0142' },
    { name: 'Dr. Sarah Chen', relationship: 'Neurologist', phone: '(214) 555-0198' },
    { name: 'James Ezernack', relationship: 'Brother', phone: '(318) 555-0267' },
  ],
  criticalNotes: [
    'Patient may appear confused during freeze episodes — this is NOT intoxication or psychiatric emergency.',
    'Dystonia risk increases in cold environments — keep warm.',
    'Autonomic instability may cause blood pressure fluctuations.',
    'Do NOT abruptly discontinue Parkinson\'s medications — risk of neuroleptic malignant syndrome.',
    'Patient may have difficulty communicating during "off" periods.',
  ],
  doNotDo: [
    'Do NOT administer haloperidol or typical antipsychotics.',
    'Do NOT administer metoclopramide (Reglan).',
    'Do NOT restrain during dystonic episodes.',
    'Do NOT assume altered mental status is psychiatric.',
  ],
  medicalFacility: 'Axxess Home Health — Dallas, TX',
  medicalFacilityPhone: '(214) 555-0300',
  insuranceInfo: 'Blue Cross Blue Shield — ID: XYZ123456',
};

export default function EmergencyCardScreen() {
  const { isDemoMode } = useDemoMode();
  const [expanded, setExpanded] = useState(true);

  const callNumber = (phone: string) => {
    const url = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Cannot Make Call', 'Phone calls are not supported on this device.');
      }
    });
  };

  const call911 = () => {
    Alert.alert(
      'Call 911',
      'This will dial emergency services. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 911', style: 'destructive', onPress: () => callNumber('911') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Emergency Header */}
        <View style={styles.emergencyHeader}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyTitle}>EMERGENCY CARD</Text>
          <Text style={styles.emergencySubtitle}>Show this to first responders</Text>
        </View>

        {/* 911 Button */}
        <TouchableOpacity style={styles.call911Button} onPress={call911}>
          <Text style={styles.call911Text}>CALL 911</Text>
        </TouchableOpacity>

        {/* Patient ID */}
        <View style={styles.idCard}>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>PATIENT</Text>
            <Text style={styles.idValue}>{EMERGENCY_DATA.patientName}</Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>DOB</Text>
            <Text style={styles.idValue}>{EMERGENCY_DATA.dateOfBirth}</Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>BLOOD TYPE</Text>
            <Text style={styles.idValue}>{EMERGENCY_DATA.bloodType}</Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>DIAGNOSIS</Text>
            <Text style={styles.idValue}>{EMERGENCY_DATA.diagnosis}</Text>
          </View>
        </View>

        {/* ALLERGIES — HIGH VISIBILITY */}
        <View style={styles.allergyCard}>
          <Text style={styles.allergyTitle}>⚠ ALLERGIES</Text>
          {EMERGENCY_DATA.allergies.map((allergy, i) => (
            <Text key={i} style={styles.allergyItem}>{allergy}</Text>
          ))}
        </View>

        {/* DO NOT DO */}
        <View style={styles.doNotDoCard}>
          <Text style={styles.doNotDoTitle}>🚫 DO NOT</Text>
          {EMERGENCY_DATA.doNotDo.map((item, i) => (
            <Text key={i} style={styles.doNotDoItem}>{item}</Text>
          ))}
        </View>

        {/* Critical Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Notes for First Responders</Text>
          {EMERGENCY_DATA.criticalNotes.map((note, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={styles.noteBullet}>!</Text>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>

        {/* Current Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          {EMERGENCY_DATA.medications.map((med, i) => (
            <View key={i} style={styles.medRow}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetail}>{med.dosage} — {med.frequency}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {EMERGENCY_DATA.emergencyContacts.map((contact, i) => (
            <TouchableOpacity
              key={i}
              style={styles.contactCard}
              onPress={() => callNumber(contact.phone)}
            >
              <View>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
              </View>
              <View style={styles.callButton}>
                <Text style={styles.callButtonText}>CALL</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Medical Facility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Facility</Text>
          <TouchableOpacity
            style={styles.facilityCard}
            onPress={() => callNumber(EMERGENCY_DATA.medicalFacilityPhone)}
          >
            <Text style={styles.facilityName}>{EMERGENCY_DATA.medicalFacility}</Text>
            <Text style={styles.facilityPhone}>{EMERGENCY_DATA.medicalFacilityPhone}</Text>
          </TouchableOpacity>
        </View>

        {/* Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance</Text>
          <View style={styles.insuranceCard}>
            <Text style={styles.insuranceText}>{EMERGENCY_DATA.insuranceInfo}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by NeuroSync Care — AI-Powered Preventive Health Partner
          </Text>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
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
  emergencyHeader: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emergencyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emergencyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  emergencySubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  call911Button: {
    backgroundColor: '#dc2626',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#fff',
  },
  call911Text: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  idCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  idLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  idValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  allergyCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
  },
  allergyTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  allergyItem: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: '600',
    paddingVertical: 2,
    paddingLeft: spacing.sm,
  },
  doNotDoCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  doNotDoTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  doNotDoItem: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
    paddingVertical: 3,
    paddingLeft: spacing.sm,
    lineHeight: 20,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  noteRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
  },
  noteBullet: {
    color: colors.warning,
    fontWeight: 'bold',
    fontSize: fontSize.md,
    marginRight: spacing.sm,
    width: 16,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  medRow: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  medName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  medDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  callButton: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  callButtonText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: fontSize.sm,
  },
  contactPhone: {
    color: colors.success,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  facilityCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  facilityName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  facilityPhone: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  insuranceCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  insuranceText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
});
