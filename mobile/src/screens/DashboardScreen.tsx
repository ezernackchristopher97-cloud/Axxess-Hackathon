import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  imagesGenerated: number;
  ocrScans: number;
  tokensUsed: number;
  avgResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'chat' | 'image' | 'ocr';
  title: string;
  timestamp: string;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(),
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return 'chatbubbles';
      case 'image':
        return 'image';
      case 'ocr':
        return 'scan';
      default:
        return 'ellipse';
    }
  };

  const quickActions = [
    { icon: 'chatbubbles', label: 'New Chat', screen: 'Chat', color: '#50C878' },
    { icon: 'image', label: 'Generate Image', screen: 'ImageGenerator', color: '#FFD700' },
    { icon: 'scan', label: 'OCR Scan', screen: 'OCRScanner', color: '#4169E1' },
    { icon: 'cube', label: 'Architecture', screen: 'Architecture', color: '#9370DB' },
  ];

  return (
    <LinearGradient colors={['#0a1a0a', '#0d2818', '#0a1a0a']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#50C878"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#50C878" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles-outline" size={24} color="#50C878" />
              <Text style={styles.statValue}>{stats?.totalConversations || 0}</Text>
              <Text style={styles.statLabel}>Conversations</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbox-outline" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{stats?.totalMessages || 0}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="image-outline" size={24} color="#4169E1" />
              <Text style={styles.statValue}>{stats?.imagesGenerated || 0}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="scan-outline" size={24} color="#9370DB" />
              <Text style={styles.statValue}>{stats?.ocrScans || 0}</Text>
              <Text style={styles.statLabel}>OCR Scans</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <Ionicons name="flash-outline" size={20} color="#FFD700" />
                <Text style={styles.metricLabel}>Tokens Used</Text>
              </View>
              <Text style={styles.metricValue}>
                {(stats?.tokensUsed || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <Ionicons name="time-outline" size={20} color="#50C878" />
                <Text style={styles.metricLabel}>Avg Response Time</Text>
              </View>
              <Text style={styles.metricValue}>
                {(stats?.avgResponseTime || 0).toFixed(1)}s
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={20}
                    color="#50C878"
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="time-outline" size={48} color="#333" />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* AIModelG3 Info */}
        <TouchableOpacity
          style={styles.architectureCard}
          onPress={() => navigation.navigate('Architecture')}
        >
          <LinearGradient
            colors={['rgba(80, 200, 120, 0.1)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.architectureGradient}
          >
            <View style={styles.architectureContent}>
              <View>
                <Text style={styles.architectureTitle}>AIModelG3 Architecture</Text>
                <Text style={styles.architectureSubtitle}>
                  Explore entropy analysis, quaternion encoding, and more
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#50C878" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>REOP-AI v2.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d1f0d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricsCard: {
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#1a3a1a',
    marginVertical: 12,
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#50C878',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1f0d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  architectureCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  architectureGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  architectureContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  architectureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  architectureSubtitle: {
    fontSize: 13,
    color: '#a0a0a0',
    maxWidth: 250,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
