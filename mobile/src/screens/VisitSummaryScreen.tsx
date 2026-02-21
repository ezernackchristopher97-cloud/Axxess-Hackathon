import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useDemoMode } from '../contexts/DemoContext';
import { summarizeVisitNotes } from '../services/featherless';

const SAMPLE_NOTES = `Patient presents for neurological follow-up. Reports changes in symptom frequency over the past week, particularly in the morning before first medication dose. Two episodes noted this week. Sleep remains disrupted. Environmental factors have worsened secondary symptoms. Current medication regimen reviewed. Medication adherence 92%. No falls this week. Caregiver reports patient seems more fatigued than usual. Plan to adjust medication timing, consider therapy referral, recommend further diagnostic workup. Follow-up 4 weeks.`;

export default function VisitSummaryScreen() {
  const { isDemoMode } = useDemoMode();
  const [notes, setNotes] = useState('');
  const [structuredSummary, setStructuredSummary] = useState('');
  const [patientSummary, setPatientSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'structured' | 'patient'>('input');

  const loadSampleNotes = () => {
    setNotes(SAMPLE_NOTES);
  };

  const generateSummaries = async () => {
    if (!notes.trim()) {
      Alert.alert('No Notes', 'Please enter or paste visit notes first.');
      return;
    }

    setLoading(true);
    try {
      const [structured, patient] = await Promise.all([
        summarizeVisitNotes(notes, 'structured', isDemoMode),
        summarizeVisitNotes(notes, 'patient-friendly', isDemoMode),
      ]);
      setStructuredSummary(structured);
      setPatientSummary(patient);
      setActiveTab('structured');
    } catch (error) {
      console.error('Summary generation error:', error);
      Alert.alert('Error', 'Failed to generate summaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${label} copied to clipboard.`);
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown-like rendering
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <Text key={index} style={styles.mdH2}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={index} style={styles.mdH3}>
            {line.replace('### ', '')}
          </Text>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} style={styles.mdBold}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <Text key={index} style={styles.mdListItem}>
            {line}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <Text key={index} style={styles.mdListItem}>
            {'  '}{line}
          </Text>
        );
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <Text key={index} style={styles.mdItalic}>
            {line.replace(/\*/g, '')}
          </Text>
        );
      }
      if (line.trim() === '') {
        return <View key={index} style={{ height: 8 }} />;
      }
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/);
      if (parts.length > 1) {
        return (
          <Text key={index} style={styles.mdText}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={i} style={{ fontWeight: 'bold', color: colors.text }}>
                    {part.replace(/\*\*/g, '')}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.mdText}>
          {line}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE</Text>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['input', 'structured', 'patient'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'input' ? 'Notes' : tab === 'structured' ? 'Structured' : 'Patient View'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'input' && (
          <View>
            <Text style={styles.sectionTitle}>Visit Notes Input</Text>
            <Text style={styles.sectionSubtitle}>
              Paste or type clinician notes. The AI will generate both a structured clinical summary and a patient-friendly version.
            </Text>

            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={12}
              placeholder="Paste visit notes here..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.sampleButton} onPress={loadSampleNotes}>
                <Text style={styles.sampleButtonText}>Load Sample</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                onPress={generateSummaries}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Summaries</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ICD Mapping Notice */}
            <View style={styles.icdNotice}>
              <Text style={styles.icdTitle}>ICD Code Mapping</Text>
              <Text style={styles.icdText}>
                ICD-10 auto-tagging module is planned for future release. Current demo focuses on narrative summarization and patient-friendly translation.
              </Text>
            </View>

            {/* EMR Integration Concept */}
            <View style={styles.emrNotice}>
              <Text style={styles.emrTitle}>EMR Integration</Text>
              <Text style={styles.emrText}>
                Export summaries via copy/clipboard. Direct EMR API integration (HL7 FHIR) is a planned feature. Current demo supports copy-to-clipboard and conceptual "Send to Provider" workflow.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'structured' && (
          <View>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Structured Clinical Summary</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(structuredSummary, 'Structured summary')}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            {structuredSummary ? (
              <View style={styles.summaryContent}>
                {renderMarkdown(structuredSummary)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No summary generated yet. Go to the Notes tab and generate summaries first.
                </Text>
              </View>
            )}

            {structuredSummary && (
              <TouchableOpacity style={styles.sendButton}>
                <Text style={styles.sendButtonText}>Send to Provider (Demo)</Text>
                <Text style={styles.sendSubtext}>Conceptual EMR integration</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'patient' && (
          <View>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Patient-Friendly Summary</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(patientSummary, 'Patient summary')}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            {patientSummary ? (
              <View style={styles.summaryContent}>
                {renderMarkdown(patientSummary)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No summary generated yet. Go to the Notes tab and generate summaries first.
                </Text>
              </View>
            )}
          </View>
        )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollContent: { padding: spacing.md, paddingBottom: 40 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.sm,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sampleButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  generateButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  icdNotice: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.info,
  },
  icdTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.info,
    marginBottom: spacing.xs,
  },
  icdText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emrNotice: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emrTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  emrText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  copyButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  copyButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  summaryContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  sendSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  mdH2: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  mdH3: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  mdBold: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mdText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 2,
  },
  mdListItem: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingLeft: spacing.sm,
    marginBottom: 2,
  },
  mdItalic: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 2,
  },
});
