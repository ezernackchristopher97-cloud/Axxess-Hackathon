import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

interface DrugAlert {
  id: string;
  patientId: string;
  patientName: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  drugs: string[];
  interactionType: string;
  description: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface AlertStats {
  total: number;
  unacknowledged: number;
  critical: number;
  major: number;
  moderate: number;
  minor: number;
}

export default function ClinicianDashboardScreen() {
  const [alerts, setAlerts] = useState<DrugAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showUnacknowledgedOnly, setShowUnacknowledgedOnly] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [alertsResponse, statsResponse] = await Promise.all([
        api.drugAlerts.getAlerts({ 
          unacknowledgedOnly: showUnacknowledgedOnly,
          limit: 100 
        }),
        api.drugAlerts.getStatistics(),
      ]);
      setAlerts(alertsResponse.alerts || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showUnacknowledgedOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.drugAlerts.acknowledge({ alertId, notes: 'Acknowledged via mobile' });
      Alert.alert('Success', 'Alert acknowledged');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'major': return '#EA580C';
      case 'moderate': return '#CA8A04';
      case 'minor': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || 
      alert.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.drugs.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const renderAlert = ({ item }: { item: DrugAlert }) => (
    <View style={[styles.alertCard, { borderLeftColor: getSeverityColor(item.severity) }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.alertTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      
      <Text style={styles.patientName}>{item.patientName}</Text>
      <Text style={styles.drugList}>{item.drugs.join(' + ')}</Text>
      <Text style={styles.interactionType}>{item.interactionType}</Text>
      <Text style={styles.description}>{item.description}</Text>
      
      {!item.acknowledged && (
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={() => handleAcknowledge(item.id)}
        >
          <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
      
      {item.acknowledged && (
        <Text style={styles.acknowledgedText}>
          Acknowledged by {item.acknowledgedBy} at {new Date(item.acknowledgedAt!).toLocaleString()}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clinician Dashboard</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.unacknowledged}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.critical}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FED7AA' }]}>
            <Text style={[styles.statValue, { color: '#EA580C' }]}>{stats.major}</Text>
            <Text style={styles.statLabel}>Major</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statValue, { color: '#CA8A04' }]}>{stats.moderate}</Text>
            <Text style={styles.statLabel}>Moderate</Text>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients or drugs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'critical', 'major', 'moderate', 'minor'].map(severity => (
            <TouchableOpacity
              key={severity}
              style={[
                styles.filterButton,
                filterSeverity === severity && styles.filterButtonActive
              ]}
              onPress={() => setFilterSeverity(severity)}
            >
              <Text style={[
                styles.filterButtonText,
                filterSeverity === severity && styles.filterButtonTextActive
              ]}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowUnacknowledgedOnly(!showUnacknowledgedOnly)}
      >
        <Text style={styles.toggleButtonText}>
          {showUnacknowledgedOnly ? 'Show All Alerts' : 'Show Unacknowledged Only'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.alertsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  alertsList: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  drugList: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
  interactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#10B981',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
