import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.disclaimerText}>Research Use Only - Requires physician verification</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Upload')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                <Ionicons name="cloud-upload" size={24} color="#14B8A6" />
              </View>
              <Text style={styles.actionTitle}>Upload Data</Text>
              <Text style={styles.actionDesc}>DICOM, NIfTI, EDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Analysis')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="analytics" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Run Analysis</Text>
              <Text style={styles.actionDesc}>Entropy computation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Chat')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                <Ionicons name="chatbubble" size={24} color="#14B8A6" />
              </View>
              <Text style={styles.actionTitle}>AI Assistant</Text>
              <Text style={styles.actionDesc}>Query results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Settings')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="bar-chart" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionDesc}>Analysis history</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total Analyses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0ms</Text>
              <Text style={styles.statLabel}>Avg Processing</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0/10</Text>
              <Text style={styles.statLabel}>Usage</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Features</Text>
          {['Multi-modal Imaging', 'Entropy Analysis', 'ML Classification', '3D Visualization'].map((feature, i) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <Ionicons name={i % 2 === 0 ? 'cube' : 'analytics'} size={20} color={i % 2 === 0 ? '#14B8A6' : '#F59E0B'} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>Active</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 8, marginBottom: 20, gap: 8 },
  disclaimerText: { color: '#FDE68A', fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', backgroundColor: '#1E293B', padding: 16, borderRadius: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  actionDesc: { color: '#94A3B8', fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1E293B', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { color: '#14B8A6', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { color: '#94A3B8', fontSize: 12 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 10, marginBottom: 8 },
  featureLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { color: '#F8FAFC', fontSize: 14 },
  featureBadge: { backgroundColor: 'rgba(20, 184, 166, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  featureBadgeText: { color: '#14B8A6', fontSize: 12, fontWeight: '600' },
});
