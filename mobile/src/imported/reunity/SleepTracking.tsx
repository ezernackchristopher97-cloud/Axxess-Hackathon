import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface SleepEntry {
  id: string;
  date: string;
  duration: number;
  quality: number;
  entropyImpact: number;
}

export default function SleepTracking() {
  const [activeTab, setActiveTab] = useState<'log' | 'trends' | 'insights'>('log');
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(70);
  const [wakeUps, setWakeUps] = useState(1);

  const sleepEntries: SleepEntry[] = [
    { id: '1', date: '2026-01-25', duration: 7.5, quality: 75, entropyImpact: -5 },
    { id: '2', date: '2026-01-24', duration: 5.5, quality: 45, entropyImpact: 12 },
    { id: '3', date: '2026-01-23', duration: 8.0, quality: 85, entropyImpact: -8 },
  ];

  const avgQuality = Math.round(sleepEntries.reduce((sum, e) => sum + e.quality, 0) / sleepEntries.length);
  const avgDuration = (sleepEntries.reduce((sum, e) => sum + e.duration, 0) / sleepEntries.length).toFixed(1);
  const avgEntropy = Math.round(sleepEntries.reduce((sum, e) => sum + e.entropyImpact, 0) / sleepEntries.length);

  const getQualityColor = (q: number) => {
    if (q >= 80) return '#22c55e';
    if (q >= 60) return '#eab308';
    if (q >= 40) return '#f97316';
    return '#ef4444';
  };

  const getEntropyColor = (e: number) => {
    if (e <= -5) return '#22c55e';
    if (e <= 0) return '#3b82f6';
    if (e <= 5) return '#eab308';
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="moon" size={24} color="#818cf8" />
        </View>
        <View>
          <Text style={styles.title}>Sleep Tracking</Text>
          <Text style={styles.subtitle}>Monitor sleep quality and entropy impact</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getQualityColor(avgQuality) }]}>{avgQuality}%</Text>
          <Text style={styles.statLabel}>Avg Quality</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#818cf8' }]}>{avgDuration}h</Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.entropyValue}>
            <Ionicons 
              name={avgEntropy < 0 ? 'trending-down' : avgEntropy > 0 ? 'trending-up' : 'remove'} 
              size={16} 
              color={getEntropyColor(avgEntropy)} 
            />
            <Text style={[styles.statValue, { color: getEntropyColor(avgEntropy) }]}>
              {avgEntropy > 0 ? '+' : ''}{avgEntropy}
            </Text>
          </View>
          <Text style={styles.statLabel}>Entropy</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'log', label: 'Log', icon: 'moon' },
          { id: 'trends', label: 'Trends', icon: 'trending-up' },
          { id: 'insights', label: 'Insights', icon: 'bulb' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.id ? '#fff' : '#a1a1aa'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log Tab */}
      {activeTab === 'log' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Last Night's Sleep</Text>
          
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <View style={styles.timeLabel}>
                <Ionicons name="moon" size={16} color="#818cf8" />
                <Text style={styles.timeLabelText}>Bedtime</Text>
              </View>
              <TextInput
                style={styles.timeValue}
                value={bedtime}
                onChangeText={setBedtime}
                placeholder="22:00"
                placeholderTextColor="#52525b"
              />
            </View>
            <View style={styles.timeInput}>
              <View style={styles.timeLabel}>
                <Ionicons name="sunny" size={16} color="#fbbf24" />
                <Text style={styles.timeLabelText}>Wake Time</Text>
              </View>
              <TextInput
                style={styles.timeValue}
                value={wakeTime}
                onChangeText={setWakeTime}
                placeholder="07:00"
                placeholderTextColor="#52525b"
              />
            </View>
          </View>

          <View style={styles.qualitySection}>
            <Text style={styles.qualityLabel}>
              Sleep Quality: <Text style={{ color: getQualityColor(quality) }}>{quality}%</Text>
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={quality}
              onValueChange={setQuality}
              minimumTrackTintColor="#818cf8"
              maximumTrackTintColor="#3f3f46"
              thumbTintColor="#818cf8"
            />
            <View style={styles.qualityLabels}>
              <Text style={styles.qualityLabelText}>Poor</Text>
              <Text style={styles.qualityLabelText}>Fair</Text>
              <Text style={styles.qualityLabelText}>Good</Text>
              <Text style={styles.qualityLabelText}>Excellent</Text>
            </View>
          </View>

          <View style={styles.wakeUpsSection}>
            <Text style={styles.wakeUpsLabel}>Night Wake-ups: {wakeUps}</Text>
            <View style={styles.wakeUpsButtons}>
              {[0, 1, 2, 3, 4, 5].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.wakeUpButton, wakeUps === num && styles.activeWakeUp]}
                  onPress={() => setWakeUps(num)}
                >
                  <Text style={[styles.wakeUpText, wakeUps === num && styles.activeWakeUpText]}>
                    {num}{num === 5 ? '+' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.logButton}>
            <Ionicons name="moon" size={20} color="#fff" />
            <Text style={styles.logButtonText}>Log Sleep Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <View style={styles.section}>
          {sleepEntries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryDate}>
                  <Ionicons name="calendar" size={14} color="#a1a1aa" />
                  <Text style={styles.entryDateText}>
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.entropyBadge, { backgroundColor: entry.entropyImpact <= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                  <Text style={[styles.entropyBadgeText, { color: entry.entropyImpact <= 0 ? '#22c55e' : '#ef4444' }]}>
                    {entry.entropyImpact > 0 ? '+' : ''}{entry.entropyImpact} entropy
                  </Text>
                </View>
              </View>
              <View style={styles.entryStats}>
                <View style={styles.entryStat}>
                  <Text style={[styles.entryStatValue, { color: '#818cf8' }]}>{entry.duration.toFixed(1)}h</Text>
                  <Text style={styles.entryStatLabel}>Duration</Text>
                </View>
                <View style={styles.entryStat}>
                  <Text style={[styles.entryStatValue, { color: getQualityColor(entry.quality) }]}>{entry.quality}%</Text>
                  <Text style={styles.entryStatLabel}>Quality</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <View style={styles.section}>
          <View style={[styles.insightCard, { borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: '#22c55e' }]}>What's Working</Text>
              <Text style={styles.insightText}>
                Your best sleep nights include meditation and consistent routines.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, { borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
            <Ionicons name="warning" size={20} color="#eab308" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: '#eab308' }]}>Areas to Improve</Text>
              <Text style={styles.insightText}>
                Late caffeine and screen time correlate with higher entropy scores.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, { borderColor: 'rgba(129, 140, 248, 0.3)' }]}>
            <Ionicons name="analytics" size={20} color="#818cf8" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: '#818cf8' }]}>Sleep-Entropy Connection</Text>
              <Text style={styles.insightText}>
                Each 10% improvement in sleep quality reduces entropy by ~2 points.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(129, 140, 248, 0.2)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a1a1aa' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#71717a', marginTop: 2 },
  entropyValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 8, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6, borderRadius: 6 },
  activeTab: { backgroundColor: '#818cf8' },
  tabText: { fontSize: 14, color: '#a1a1aa' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeInput: { flex: 1, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 12, padding: 12 },
  timeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  timeLabelText: { fontSize: 12, color: '#a1a1aa' },
  timeValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  qualitySection: { marginTop: 20 },
  qualityLabel: { fontSize: 14, color: '#a1a1aa', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  qualityLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  qualityLabelText: { fontSize: 10, color: '#71717a' },
  wakeUpsSection: { marginTop: 20 },
  wakeUpsLabel: { fontSize: 14, color: '#a1a1aa', marginBottom: 8 },
  wakeUpsButtons: { flexDirection: 'row', gap: 8 },
  wakeUpButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center' },
  activeWakeUp: { backgroundColor: '#818cf8', borderColor: '#818cf8' },
  wakeUpText: { fontSize: 14, color: '#a1a1aa' },
  activeWakeUpText: { color: '#fff', fontWeight: '600' },
  logButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#818cf8', paddingVertical: 14, borderRadius: 8, marginTop: 20, gap: 8 },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  entryCard: { backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryDateText: { fontSize: 14, color: '#a1a1aa' },
  entropyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  entropyBadgeText: { fontSize: 12, fontWeight: '600' },
  entryStats: { flexDirection: 'row', gap: 24 },
  entryStat: { alignItems: 'center' },
  entryStatValue: { fontSize: 20, fontWeight: 'bold' },
  entryStatLabel: { fontSize: 10, color: '#71717a', marginTop: 2 },
  insightCard: { flexDirection: 'row', backgroundColor: 'rgba(39, 39, 42, 0.3)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, gap: 12 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  insightText: { fontSize: 13, color: '#a1a1aa', lineHeight: 18 },
});
