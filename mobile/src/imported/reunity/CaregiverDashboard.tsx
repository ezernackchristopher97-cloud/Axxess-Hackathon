import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LovedOne {
  id: string;
  name: string;
  relationship: string;
  lastActive: string;
  currentMood: 'great' | 'good' | 'okay' | 'struggling' | 'crisis';
  moodTrend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  checkInStreak: number;
  unreadAlerts: number;
}

const MOOD_COLORS = {
  great: '#10b981',
  good: '#22c55e',
  okay: '#eab308',
  struggling: '#f97316',
  crisis: '#ef4444',
};

const MOOD_LABELS = {
  great: 'Feeling Great',
  good: 'Doing Good',
  okay: 'Okay',
  struggling: 'Struggling',
  crisis: 'In Crisis',
};

const RISK_COLORS = {
  low: '#10b981',
  moderate: '#eab308',
  elevated: '#f97316',
  high: '#ef4444',
};

export default function CaregiverDashboard() {
  const [lovedOnes, setLovedOnes] = useState<LovedOne[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<LovedOne | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');

  useEffect(() => {
    // Demo data
    setLovedOnes([
      {
        id: '1',
        name: 'Alex',
        relationship: 'Child',
        lastActive: '1 hour ago',
        currentMood: 'good',
        moodTrend: 'improving',
        riskLevel: 'low',
        checkInStreak: 7,
        unreadAlerts: 0,
      },
      {
        id: '2',
        name: 'Jordan',
        relationship: 'Sibling',
        lastActive: '2 hours ago',
        currentMood: 'struggling',
        moodTrend: 'declining',
        riskLevel: 'elevated',
        checkInStreak: 2,
        unreadAlerts: 2,
      },
    ]);
  }, []);

  const handleCall = (name: string) => {
    Alert.alert('Call ' + name, 'Would you like to call ' + name + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL('tel:+1234567890') },
    ]);
  };

  const handleMessage = (name: string) => {
    Alert.alert('Message ' + name, 'Would you like to message ' + name + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Message', onPress: () => Linking.openURL('sms:+1234567890') },
    ]);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { name: 'trending-up', color: '#10b981' };
      case 'declining': return { name: 'trending-down', color: '#ef4444' };
      default: return { name: 'remove', color: '#71717a' };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="heart" size={28} color="#ec4899" />
        <Text style={styles.title}>Caregiver Dashboard</Text>
      </View>
      <Text style={styles.subtitle}>Monitor your loved ones' wellness</Text>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Ionicons name="shield-checkmark" size={20} color="#10b981" />
        <Text style={styles.privacyText}>
          All data sharing is controlled by your loved ones
        </Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="person-add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Link Loved One</Text>
      </TouchableOpacity>

      {/* Loved Ones List */}
      {lovedOnes.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={[
            styles.personCard,
            (person.riskLevel === 'elevated' || person.riskLevel === 'high') && styles.alertCard
          ]}
          onPress={() => setSelectedPerson(person)}
        >
          <View style={styles.personHeader}>
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.personName}>{person.name}</Text>
                {person.unreadAlerts > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{person.unreadAlerts}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.relationship}>{person.relationship}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[person.riskLevel] + '30' }]}>
              <Text style={[styles.riskText, { color: RISK_COLORS[person.riskLevel] }]}>
                {person.riskLevel} risk
              </Text>
            </View>
          </View>

          <View style={styles.moodRow}>
            <View style={[styles.moodBadge, { backgroundColor: MOOD_COLORS[person.currentMood] + '30' }]}>
              <Text style={[styles.moodText, { color: MOOD_COLORS[person.currentMood] }]}>
                {MOOD_LABELS[person.currentMood]}
              </Text>
            </View>
            <Ionicons
              name={getTrendIcon(person.moodTrend).name as any}
              size={20}
              color={getTrendIcon(person.moodTrend).color}
            />
            <Text style={styles.lastActive}>{person.lastActive}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="flame" size={16} color="#f97316" />
              <Text style={styles.statText}>{person.checkInStreak} day streak</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(person.name)}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMessage(person.name)}
            >
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.actionText}>Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Ionicons name="person-add" size={48} color="#ec4899" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Link a Loved One</Text>
            <Text style={styles.modalDescription}>
              Enter the sharing code provided by your loved one
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={linkCode}
              onChangeText={setLinkCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#71717a"
              keyboardType="number-pad"
              maxLength={6}
            />
            
            <View style={styles.privacyBox}>
              <Ionicons name="shield" size={20} color="#10b981" />
              <Text style={styles.privacyBoxText}>
                Your loved one controls what information is shared with you
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => {
                Alert.alert('Connected!', 'You will be notified when they accept.');
                setShowAddModal(false);
                setLinkCode('');
              }}
            >
              <Text style={styles.connectButtonText}>Connect Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedPerson}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPerson(null)}
      >
        {selectedPerson && (
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPerson(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.detailName}>{selectedPerson.name}</Text>
              <Text style={styles.detailRelationship}>{selectedPerson.relationship}</Text>
              
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[selectedPerson.riskLevel] + '30', alignSelf: 'center', marginVertical: 16 }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[selectedPerson.riskLevel] }]}>
                  {selectedPerson.riskLevel.toUpperCase()} RISK
                </Text>
              </View>
              
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Ionicons name="happy" size={32} color={MOOD_COLORS[selectedPerson.currentMood]} />
                  <Text style={styles.detailStatLabel}>Current Mood</Text>
                  <Text style={styles.detailStatValue}>{MOOD_LABELS[selectedPerson.currentMood]}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Ionicons name="flame" size={32} color="#f97316" />
                  <Text style={styles.detailStatLabel}>Check-in Streak</Text>
                  <Text style={styles.detailStatValue}>{selectedPerson.checkInStreak} days</Text>
                </View>
              </View>
              
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleCall(selectedPerson.name)}
                >
                  <Ionicons name="call" size={24} color="#fff" />
                  <Text style={styles.detailActionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: '#3b82f6' }]}
                  onPress={() => handleMessage(selectedPerson.name)}
                >
                  <Ionicons name="chatbubble" size={24} color="#fff" />
                  <Text style={styles.detailActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b98120',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  personCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  alertCard: {
    borderColor: '#f9731650',
    backgroundColor: '#f9731610',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  relationship: {
    fontSize: 14,
    color: '#9ca3af',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastActive: {
    fontSize: 12,
    color: '#71717a',
    marginLeft: 'auto',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    padding: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#10b98120',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  privacyBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
  },
  connectButton: {
    width: '100%',
    backgroundColor: '#ec4899',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  detailModalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  detailName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
  detailRelationship: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 8,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 16,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  detailActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
