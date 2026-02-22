import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';

export default function NeuroSyncSettingsScreen() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [showAboutModal, setShowAboutModal] = useState(false);

  const showArchitecture = () => {
    Alert.alert(
      'Architecture',
      'NeuroSync Care Architecture:\n\n' +
      'Mobile: Expo 54 + React Native 0.81\n' +
      'Base: REOP AI Mobile (newest SDK)\n' +
      'Entropy: Neural Entropy BoraFramework\n' +
      'Caregiver: ReUnity components\n' +
      'AI: Featherless AI (OpenAI-compatible)\n' +
      'Backend: Node.js/Express proxy server\n\n' +
      'All original codebases in /archive',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Demo Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Mode</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Demo Mode</Text>
              <Text style={styles.settingDescription}>
                {isDemoMode
                  ? 'Using mock data (no API key required)'
                  : 'Live mode (requires Featherless API key on server)'}
              </Text>
            </View>
            <Switch
              value={isDemoMode}
              onValueChange={toggleDemoMode}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isDemoMode ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={[styles.modeIndicator, { backgroundColor: isDemoMode ? colors.warning + '20' : colors.success + '20' }]}>
            <Text style={[styles.modeText, { color: isDemoMode ? colors.warning : colors.success }]}>
              {isDemoMode ? '⚡ DEMO MODE: Mock AI responses, no API calls' : '🟢 LIVE MODE: Using Featherless AI backend'}
            </Text>
          </View>
        </View>

        {/* Personal Narrative */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Exists</Text>
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeQuote}>
              "I built this from the inside."
            </Text>
            <Text style={styles.narrativeBody}>
              I'm Christopher Ezernack. I live with a neurological condition and 
              rely on caregiver coordination, provider communication, and first responder 
              awareness every day.
            </Text>
            <Text style={styles.narrativeBody}>
              I don't just need reminders. I need 
              prediction, synchronization, and protection. My caregiver needs different data 
              than my neurologist. First responders need to know what they're seeing is a 
              neurological condition, not something else.
            </Text>
            <Text style={styles.narrativeBody}>
              This app bridges the gap between patient, caregiver, clinician, and first 
              responder, built from lived experience with the Axxess home health ecosystem.
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowAboutModal(true)}>
            <Text style={styles.menuItemText}>About NeuroSync Care</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={showArchitecture}>
            <Text style={styles.menuItemText}>Architecture Details</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* My Projects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Projects</Text>
          <View style={styles.sourceCard}>
            <Text style={styles.sourceName}>REOP AI</Text>
            <Text style={styles.sourceDescription}>Chat interface, assistant framework, auth system</Text>
            <Text style={styles.sourceFiles}>32 files · 9,249 lines</Text>
          </View>
          <View style={styles.sourceCard}>
            <Text style={styles.sourceName}>Neural Entropy</Text>
            <Text style={styles.sourceDescription}>BoraFramework entropy scoring, clinician dashboard, risk analysis</Text>
            <Text style={styles.sourceFiles}>264 files · 84,767 lines (mobile + railway)</Text>
          </View>
          <View style={styles.sourceCard}>
            <Text style={styles.sourceName}>ReUnity</Text>
            <Text style={styles.sourceDescription}>Caregiver dashboard, emergency contacts, medication reminders</Text>
            <Text style={styles.sourceFiles}>357 files · 168,854 lines (mobile + webapp)</Text>
          </View>
        </View>

        {/* Axxess Hackathon Alignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Axxess Hackathon 2026</Text>
          <View style={styles.trackCard}>
            <Text style={styles.trackLabel}>Track A</Text>
            <Text style={styles.trackTitle}>AI-Driven Preventive Health Partner</Text>
            <Text style={styles.trackMapping}>
              → Risk Score Panel (predictive modeling){'\n'}
              → Caregiver Alerts (smart notifications){'\n'}
              → Assistant Chat (virtual assistant / triage){'\n'}
              → Patient Profile (vitals + symptom tracking)
            </Text>
          </View>
          <View style={styles.trackCard}>
            <Text style={styles.trackLabel}>Track B</Text>
            <Text style={styles.trackTitle}>Diagnostic Assistant</Text>
            <Text style={styles.trackMapping}>
              → Visit Summary Generator (AI summarization){'\n'}
              → Patient-Friendly Summaries (plain language){'\n'}
              → Emergency Card (first responder data){'\n'}
              → Featherless AI (OpenAI-compatible inference)
            </Text>
          </View>
          <View style={styles.ecosystemCard}>
            <Text style={styles.ecosystemTitle}>Axxess Ecosystem Integration</Text>
            <Text style={styles.ecosystemText}>
              NeuroSync Care connects with the Axxess ecosystem: 
              EMR, Mobile Point of Care, Patient & Family Portal, and 
              Interoperability layers. Visit summary export and emergency card features 
              demonstrate EMR-ready data formatting.
            </Text>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>NeuroSync Care v1.0.0</Text>
          <Text style={styles.versionText}>Axxess Hackathon 2026</Text>
          <Text style={styles.versionText}>Powered by Featherless AI</Text>
          <Text style={styles.versionText}>© 2026 Christopher Ezernack</Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal visible={showAboutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>NeuroSync Care</Text>
              <Text style={styles.modalSubtitle}>Axxess Hackathon 2026</Text>
              
              <Text style={styles.modalSectionTitle}>What It Is</Text>
              <Text style={styles.modalBody}>
                A unified mobile health platform that combines predictive risk scoring, 
                caregiver coordination, AI-powered clinical documentation, and emergency 
                preparedness, designed specifically for patients with chronic neurological 
                conditions.
              </Text>

              <Text style={styles.modalSectionTitle}>Architecture</Text>
              <Text style={styles.modalBody}>
                NeuroSync Care integrates three of my existing systems:{'\n\n'}
                • REOP AI: Conversational AI assistant with chat, voice, and prompt engineering{'\n'}
                • Neural Entropy: Entropy-based predictive risk scoring using the BoraFramework{'\n'}
                • ReUnity: Caregiver coordination, emergency contacts, and medication management{'\n\n'}
                REOP AI Mobile (Expo 54) serves as the base, with specific modules 
                from the other two systems integrated.
              </Text>

              <Text style={styles.modalSectionTitle}>AI Integration</Text>
              <Text style={styles.modalBody}>
                Powered by Featherless AI using OpenAI-compatible endpoints 
                (api.featherless.ai/v1/chat/completions). All inference goes through a 
                lightweight Express proxy server. No API keys are hardcoded; environment 
                variables only. Demo Mode provides full mock fallback when no key is configured.
              </Text>

              <Text style={styles.modalSectionTitle}>Disclaimer</Text>
              <Text style={styles.modalBody}>
                This is a prototype. Not intended for clinical 
                use, medical diagnosis, or treatment decisions. Always consult your healthcare provider 
                for medical decisions.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAboutModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 40 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  settingInfo: { flex: 1, marginRight: spacing.md },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modeIndicator: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  modeText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  narrativeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  narrativeQuote: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontStyle: 'italic',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  narrativeBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  sourceCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sourceName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  sourceDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sourceFiles: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  trackCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  trackLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  trackMapping: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ecosystemCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginTop: spacing.sm,
  },
  ecosystemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  ecosystemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalClose: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});
