import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  pillsRemaining: number;
  pillsPerDose: number;
  refillThreshold: number;
  notificationsEnabled: boolean;
}

export default function MedicationReminders() {
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    time: '08:00',
    pillsRemaining: '30',
    pillsPerDose: '1',
  });

  useEffect(() => {
    loadMedications();
    requestNotificationPermissions();
  }, []);

  const loadMedications = async () => {
    try {
      const saved = await AsyncStorage.getItem('reunity-medications');
      if (saved) {
        setMedications(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const saveMedications = async (meds: MedicationSchedule[]) => {
    try {
      await AsyncStorage.setItem('reunity-medications', JSON.stringify(meds));
      setMedications(meds);
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications', 'Enable notifications to receive medication reminders');
    }
  };

  const scheduleNotification = async (med: MedicationSchedule) => {
    for (const time of med.times) {
      const [hours, minutes] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to take ${med.name}`,
          body: `${med.dosage} - ${med.pillsPerDose} pill(s)`,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }
  };

  const addMedication = async () => {
    if (!newMed.name || !newMed.dosage) {
      Alert.alert('Error', 'Please enter medication name and dosage');
      return;
    }

    const medication: MedicationSchedule = {
      id: Date.now().toString(),
      name: newMed.name,
      dosage: newMed.dosage,
      times: [newMed.time],
      pillsRemaining: parseInt(newMed.pillsRemaining) || 30,
      pillsPerDose: parseInt(newMed.pillsPerDose) || 1,
      refillThreshold: 7,
      notificationsEnabled: true,
    };

    const updatedMeds = [...medications, medication];
    await saveMedications(updatedMeds);
    await scheduleNotification(medication);
    
    setNewMed({ name: '', dosage: '', time: '08:00', pillsRemaining: '30', pillsPerDose: '1' });
    setShowAddForm(false);
  };

  const markAsTaken = async (medId: string) => {
    const updatedMeds = medications.map(m =>
      m.id === medId
        ? { ...m, pillsRemaining: Math.max(0, m.pillsRemaining - m.pillsPerDose) }
        : m
    );
    await saveMedications(updatedMeds);
  };

  const refillMedication = async (medId: string) => {
    const updatedMeds = medications.map(m =>
      m.id === medId ? { ...m, pillsRemaining: m.pillsRemaining + 30 } : m
    );
    await saveMedications(updatedMeds);
  };

  const deleteMedication = async (medId: string) => {
    Alert.alert('Delete Medication', 'Are you sure you want to delete this medication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedMeds = medications.filter(m => m.id !== medId);
          await saveMedications(updatedMeds);
        },
      },
    ]);
  };

  const needsRefill = (med: MedicationSchedule) => {
    const daysRemaining = Math.floor(med.pillsRemaining / (med.pillsPerDose * med.times.length));
    return daysRemaining <= med.refillThreshold;
  };

  const lowStockMeds = medications.filter(needsRefill);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medication Reminders</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {lowStockMeds.length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Refill Needed</Text>
          {lowStockMeds.map(med => (
            <View key={med.id} style={styles.alertItem}>
              <Text style={styles.alertMedName}>{med.name}</Text>
              <Text style={styles.alertMedCount}>{med.pillsRemaining} pills left</Text>
              <TouchableOpacity
                style={styles.refillButton}
                onPress={() => refillMedication(med.id)}
              >
                <Text style={styles.refillButtonText}>Refill</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Medication</Text>
          <TextInput
            style={styles.input}
            placeholder="Medication Name"
            placeholderTextColor="#666"
            value={newMed.name}
            onChangeText={text => setNewMed({ ...newMed, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g., 50mg)"
            placeholderTextColor="#666"
            value={newMed.dosage}
            onChangeText={text => setNewMed({ ...newMed, dosage: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Time (HH:MM)"
            placeholderTextColor="#666"
            value={newMed.time}
            onChangeText={text => setNewMed({ ...newMed, time: text })}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Pills Remaining"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMed.pillsRemaining}
              onChangeText={text => setNewMed({ ...newMed, pillsRemaining: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Pills Per Dose"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMed.pillsPerDose}
              onChangeText={text => setNewMed({ ...newMed, pillsPerDose: text })}
            />
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addMedication}>
              <Text style={styles.saveButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {medications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyText}>No medications added yet</Text>
          <Text style={styles.emptySubtext}>Add your medications to get reminders</Text>
        </View>
      ) : (
        medications.map(med => {
          const daysRemaining = Math.floor(med.pillsRemaining / (med.pillsPerDose * med.times.length));
          return (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>{med.dosage}</Text>
                </View>
                {needsRefill(med) && (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockText}>Low Stock</Text>
                  </View>
                )}
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medInfoText}>🕐 {med.times.join(', ')}</Text>
                <Text style={styles.medInfoText}>📦 {med.pillsRemaining} pills (~{daysRemaining} days)</Text>
              </View>
              <View style={styles.medActions}>
                <TouchableOpacity
                  style={styles.takenButton}
                  onPress={() => markAsTaken(med.id)}
                >
                  <Text style={styles.takenButtonText}>✓ Mark as Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteMedication(med.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  alertCard: { backgroundColor: '#451a03', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#92400e' },
  alertTitle: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  alertItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  alertMedName: { color: '#fff', fontWeight: '500', flex: 1 },
  alertMedCount: { color: '#fca5a5', marginRight: 12 },
  refillButton: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  refillButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  formCard: { backgroundColor: '#18181b', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  formTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#27272a', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#3f3f46' },
  formRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center' },
  cancelButtonText: { color: '#a1a1aa' },
  saveButton: { flex: 1, backgroundColor: '#7c3aed', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#71717a', fontSize: 16 },
  emptySubtext: { color: '#52525b', fontSize: 14, marginTop: 4 },
  medCard: { backgroundColor: '#18181b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  medName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  medDosage: { color: '#a78bfa', fontSize: 14, marginTop: 2 },
  lowStockBadge: { backgroundColor: '#7f1d1d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  lowStockText: { color: '#fca5a5', fontSize: 12, fontWeight: '500' },
  medInfo: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  medInfoText: { color: '#a1a1aa', fontSize: 14 },
  medActions: { flexDirection: 'row', gap: 12 },
  takenButton: { flex: 1, backgroundColor: '#065f46', padding: 12, borderRadius: 8, alignItems: 'center' },
  takenButtonText: { color: '#6ee7b7', fontWeight: '600' },
  deleteButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3f3f46' },
  deleteButtonText: { fontSize: 16 },
});
