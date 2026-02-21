import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Linking,
  Modal,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  notifyOnHighRisk: boolean;
}

interface EmergencyContactsProps {
  onHighRiskAlert?: boolean;
  riskLevel?: 'low' | 'moderate' | 'elevated' | 'high';
}

const CRISIS_HOTLINES = [
  { name: '988 Suicide & Crisis Lifeline', phone: '988', description: '24/7 crisis support' },
  { name: 'National DV Hotline', phone: '18007997233', description: 'Domestic violence help' },
  { name: 'Crisis Text Line', phone: '741741', description: 'Text HOME to connect', isText: true },
  { name: '911 Emergency', phone: '911', description: 'Immediate danger' },
];

export default function EmergencyContacts({ onHighRiskAlert = false, riskLevel = 'low' }: EmergencyContactsProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHighRiskDialog, setShowHighRiskDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false,
    notifyOnHighRisk: true,
  });
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (onHighRiskAlert && riskLevel === 'high') {
      setShowHighRiskDialog(true);
      startPulseAnimation();
    }
  }, [onHighRiskAlert, riskLevel]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('reunity_emergency_contacts');
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const saveContacts = async (newContacts: EmergencyContact[]) => {
    try {
      await AsyncStorage.setItem('reunity_emergency_contacts', JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error('Failed to save contacts:', error);
    }
  };

  const addContact = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please enter name and phone number');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      ...formData,
    };

    let updatedContacts = contacts;
    if (formData.isPrimary) {
      updatedContacts = contacts.map(c => ({ ...c, isPrimary: false }));
    }

    saveContacts([...updatedContacts, newContact]);
    resetForm();
  };

  const deleteContact = (id: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => saveContacts(contacts.filter(c => c.id !== id))
        },
      ]
    );
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  const sendText = (phone: string, message?: string) => {
    const url = message 
      ? `sms:${phone.replace(/\D/g, '')}?body=${encodeURIComponent(message)}`
      : `sms:${phone.replace(/\D/g, '')}`;
    Linking.openURL(url);
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', relationship: '', isPrimary: false, notifyOnHighRisk: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const primaryContact = contacts.find(c => c.isPrimary);

  return (
    <ScrollView style={styles.container}>
      {/* High Risk Alert Modal */}
      <Modal
        visible={showHighRiskDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHighRiskDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Animated.View style={[styles.alertIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="warning" size={32} color="#ef4444" />
            </Animated.View>
            
            <Text style={styles.modalTitle}>High Risk Detected</Text>
            <Text style={styles.modalSubtitle}>
              Your wellness data suggests you may need support
            </Text>
            
            <Text style={styles.modalText}>
              Would you like to reach out to someone? One tap to call your emergency contact or crisis line.
            </Text>

            {primaryContact && (
              <TouchableOpacity
                style={styles.primaryCallButton}
                onPress={() => {
                  makeCall(primaryContact.phone);
                  setShowHighRiskDialog(false);
                }}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  Call {primaryContact.name} ({primaryContact.relationship})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.crisisButton}
              onPress={() => {
                makeCall('988');
                setShowHighRiskDialog(false);
              }}
            >
              <Ionicons name="call" size={20} color="#ef4444" />
              <Text style={styles.crisisButtonText}>Call 988 Crisis Lifeline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => setShowHighRiskDialog(false)}
            >
              <Text style={styles.dismissText}>I'm okay for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crisis Hotlines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={styles.sectionTitle}>Crisis Hotlines</Text>
        </View>
        
        {CRISIS_HOTLINES.map((hotline, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.hotlineItem}
            onPress={() => hotline.isText ? sendText(hotline.phone, 'HELLO') : makeCall(hotline.phone)}
          >
            <View style={styles.hotlineInfo}>
              <Text style={styles.hotlineName}>{hotline.name}</Text>
              <Text style={styles.hotlineDesc}>{hotline.description}</Text>
            </View>
            <View style={styles.hotlineAction}>
              <Ionicons 
                name={hotline.isText ? 'chatbubble' : 'call'} 
                size={20} 
                color="#ef4444" 
              />
              <Text style={styles.hotlinePhone}>{hotline.phone}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Personal Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>My Emergency Contacts</Text>
          {!isAdding && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAdding(true)}
            >
              <Ionicons name="add" size={20} color="#10b981" />
            </TouchableOpacity>
          )}
        </View>

        {/* Add Contact Form */}
        {isAdding && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#71717a"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#71717a"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Relationship"
              placeholderTextColor="#71717a"
              value={formData.relationship}
              onChangeText={(text) => setFormData({ ...formData, relationship: text })}
            />
            
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
            >
              <Ionicons 
                name={formData.isPrimary ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#f59e0b" 
              />
              <Text style={styles.checkboxText}>Primary Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, notifyOnHighRisk: !formData.notifyOnHighRisk })}
            >
              <Ionicons 
                name={formData.notifyOnHighRisk ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#ef4444" 
              />
              <Text style={styles.checkboxText}>Alert on High Risk</Text>
            </TouchableOpacity>

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={addContact}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contact List */}
        {contacts.length === 0 && !isAdding ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#3f3f46" />
            <Text style={styles.emptyText}>No emergency contacts added</Text>
            <Text style={styles.emptySubtext}>Add trusted people you can reach quickly</Text>
          </View>
        ) : (
          contacts.map(contact => (
            <View 
              key={contact.id} 
              style={[styles.contactItem, contact.isPrimary && styles.primaryContact]}
            >
              <View style={styles.contactInfo}>
                <View style={styles.contactHeader}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => makeCall(contact.phone)}
                >
                  <Ionicons name="call" size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => sendText(contact.phone)}
                >
                  <Ionicons name="chatbubble" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteContact(contact.id)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
  },
  hotlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fca5a5',
  },
  hotlineDesc: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  hotlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotlinePhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  form: {
    padding: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxText: {
    color: '#a1a1aa',
    marginLeft: 8,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3f3f46',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#a1a1aa',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#71717a',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#52525b',
    fontSize: 12,
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#27272a',
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryContact: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  primaryBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  contactRelation: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  contactPhone: {
    color: '#71717a',
    fontSize: 12,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#3f3f46',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#d4d4d8',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  crisisButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  dismissButton: {
    padding: 12,
    alignItems: 'center',
  },
  dismissText: {
    color: '#71717a',
    fontSize: 14,
  },
});
