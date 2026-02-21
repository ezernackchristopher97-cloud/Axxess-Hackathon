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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  isActive: boolean;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  diagnosedDate: string;
}

export default function MedicationHistoryScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'medications' | 'allergies'>('medications');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    drugName: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    notes: '',
  });
  const [newAllergy, setNewAllergy] = useState({
    allergen: '',
    reaction: '',
    severity: 'moderate' as const,
  });

  const loadData = useCallback(async () => {
    try {
      const [medsResponse, allergiesResponse] = await Promise.all([
        api.medications.getHistory(),
        api.medications.getAllergies(),
      ]);
      setMedications(medsResponse.medications || []);
      setAllergies(allergiesResponse.allergies || []);
    } catch (error) {
      console.error('Failed to load medication history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddMedication = async () => {
    if (!newMedication.drugName || !newMedication.dosage) {
      Alert.alert('Error', 'Please fill in drug name and dosage');
      return;
    }
    try {
      await api.medications.addMedication({
        ...newMedication,
        startDate: new Date().toISOString(),
      });
      Alert.alert('Success', 'Medication added');
      setShowAddModal(false);
      setNewMedication({ drugName: '', dosage: '', frequency: '', prescribedBy: '', notes: '' });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.allergen || !newAllergy.reaction) {
      Alert.alert('Error', 'Please fill in allergen and reaction');
      return;
    }
    try {
      await api.medications.addAllergy({
        ...newAllergy,
        diagnosedDate: new Date().toISOString(),
      });
      Alert.alert('Success', 'Allergy added');
      setShowAddModal(false);
      setNewAllergy({ allergen: '', reaction: '', severity: 'moderate' });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add allergy');
    }
  };

  const handleDiscontinueMedication = async (medicationId: string) => {
    Alert.alert(
      'Discontinue Medication',
      'Are you sure you want to discontinue this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discontinue',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.medications.discontinue({ medicationId });
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to discontinue medication');
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'life-threatening': return '#DC2626';
      case 'severe': return '#EA580C';
      case 'moderate': return '#CA8A04';
      case 'mild': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <View style={[styles.card, !item.isActive && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.drugName}>{item.drugName}</Text>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Discontinued'}</Text>
        </View>
      </View>
      <Text style={styles.dosage}>{item.dosage} - {item.frequency}</Text>
      <Text style={styles.prescriber}>Prescribed by: {item.prescribedBy}</Text>
      <Text style={styles.date}>Started: {new Date(item.startDate).toLocaleDateString()}</Text>
      {item.endDate && (
        <Text style={styles.date}>Ended: {new Date(item.endDate).toLocaleDateString()}</Text>
      )}
      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      {item.isActive && (
        <TouchableOpacity
          style={styles.discontinueButton}
          onPress={() => handleDiscontinueMedication(item.id)}
        >
          <Text style={styles.discontinueButtonText}>Discontinue</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAllergy = ({ item }: { item: Allergy }) => (
    <View style={[styles.card, { borderLeftColor: getSeverityColor(item.severity) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.drugName}>{item.allergen}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.reaction}>Reaction: {item.reaction}</Text>
      <Text style={styles.date}>Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading medication history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medication History</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medications' && styles.activeTab]}
          onPress={() => setActiveTab('medications')}
        >
          <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>
            Medications ({medications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'allergies' && styles.activeTab]}
          onPress={() => setActiveTab('allergies')}
        >
          <Text style={[styles.tabText, activeTab === 'allergies' && styles.activeTabText]}>
            Allergies ({allergies.length})
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>
          + Add {activeTab === 'medications' ? 'Medication' : 'Allergy'}
        </Text>
      </TouchableOpacity>

      {activeTab === 'medications' ? (
        <FlatList
          data={medications}
          renderItem={renderMedication}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No medications recorded</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={allergies}
          renderItem={renderAllergy}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No allergies recorded</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {activeTab === 'medications' ? 'Medication' : 'Allergy'}
            </Text>

            {activeTab === 'medications' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Drug Name"
                  value={newMedication.drugName}
                  onChangeText={text => setNewMedication({ ...newMedication, drugName: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dosage (e.g., 10mg)"
                  value={newMedication.dosage}
                  onChangeText={text => setNewMedication({ ...newMedication, dosage: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Frequency (e.g., twice daily)"
                  value={newMedication.frequency}
                  onChangeText={text => setNewMedication({ ...newMedication, frequency: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Prescribed By"
                  value={newMedication.prescribedBy}
                  onChangeText={text => setNewMedication({ ...newMedication, prescribedBy: text })}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notes (optional)"
                  value={newMedication.notes}
                  onChangeText={text => setNewMedication({ ...newMedication, notes: text })}
                  multiline
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleAddMedication}>
                  <Text style={styles.submitButtonText}>Add Medication</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Allergen (e.g., Penicillin)"
                  value={newAllergy.allergen}
                  onChangeText={text => setNewAllergy({ ...newAllergy, allergen: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Reaction (e.g., Rash, Anaphylaxis)"
                  value={newAllergy.reaction}
                  onChangeText={text => setNewAllergy({ ...newAllergy, reaction: text })}
                />
                <View style={styles.severitySelector}>
                  <Text style={styles.severityLabel}>Severity:</Text>
                  <View style={styles.severityOptions}>
                    {(['mild', 'moderate', 'severe', 'life-threatening'] as const).map(sev => (
                      <TouchableOpacity
                        key={sev}
                        style={[
                          styles.severityOption,
                          newAllergy.severity === sev && { backgroundColor: getSeverityColor(sev) }
                        ]}
                        onPress={() => setNewAllergy({ ...newAllergy, severity: sev })}
                      >
                        <Text style={[
                          styles.severityOptionText,
                          newAllergy.severity === sev && { color: '#FFFFFF' }
                        ]}>
                          {sev}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleAddAllergy}>
                  <Text style={styles.submitButtonText}>Add Allergy</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  addButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveCard: {
    opacity: 0.6,
    borderLeftColor: '#9CA3AF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drugName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#DEF7EC',
  },
  inactiveBadge: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dosage: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
  prescriber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  notes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reaction: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
  },
  discontinueButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    alignItems: 'center',
  },
  discontinueButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  severitySelector: {
    marginBottom: 16,
  },
  severityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  severityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  severityOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
