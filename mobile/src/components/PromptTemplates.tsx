import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface PromptTemplate {
  id: number;
  name: string;
  prompt: string;
  category: string;
  isDefault: boolean;
}

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Code Review': 'code-slash',
  'Writing': 'document-text',
  'Image Generation': 'image',
  'Analysis': 'analytics',
  'Math': 'calculator',
  'Custom': 'star',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Code Review': '#60a5fa',
  'Writing': '#4ade80',
  'Image Generation': '#f472b6',
  'Analysis': '#fb923c',
  'Math': '#a78bfa',
  'Custom': '#ffd700',
};

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Custom');

  useEffect(() => {
    if (showModal) {
      loadTemplates();
    }
  }, [showModal]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    onSelectTemplate(template.prompt);
    setShowModal(false);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) return;

    try {
      await api.createTemplate(
        newTemplateName.trim(),
        newTemplatePrompt.trim(),
        newTemplateCategory
      );
      setShowCreateModal(false);
      setNewTemplateName('');
      setNewTemplatePrompt('');
      loadTemplates();
    } catch (error) {
      Alert.alert('Error', 'Failed to create template');
    }
  };

  const handleDeleteTemplate = (templateId: number) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteTemplate(templateId);
              loadTemplates();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));
  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  return (
    <>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="flash" size={20} color="#ffd700" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="flash" size={20} color="#ffd700" />
                <Text style={styles.modalTitle}>Prompt Templates</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === null && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === null && styles.categoryChipTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[category] || 'folder'}
                    size={14}
                    color={
                      selectedCategory === category
                        ? '#000000'
                        : CATEGORY_COLORS[category] || '#9ca3af'
                    }
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Templates List */}
            <ScrollView style={styles.templatesList}>
              {isLoading ? (
                <Text style={styles.loadingText}>Loading templates...</Text>
              ) : filteredTemplates.length === 0 ? (
                <Text style={styles.emptyText}>No templates found</Text>
              ) : (
                filteredTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => handleSelectTemplate(template)}
                    onLongPress={() => {
                      if (!template.isDefault) {
                        handleDeleteTemplate(template.id);
                      }
                    }}
                  >
                    <View style={styles.templateHeader}>
                      <View style={styles.templateTitleRow}>
                        <Ionicons
                          name={CATEGORY_ICONS[template.category] || 'folder'}
                          size={16}
                          color={CATEGORY_COLORS[template.category] || '#9ca3af'}
                        />
                        <Text style={styles.templateName}>{template.name}</Text>
                      </View>
                      {template.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.templatePrompt} numberOfLines={2}>
                      {template.prompt}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Create New Template Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#000000" />
              <Text style={styles.createButtonText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Template</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Template Name</Text>
            <TextInput
              style={styles.input}
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholder="e.g., Debug Python Code"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categorySelectRow}>
                {Object.keys(CATEGORY_ICONS).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categorySelectChip,
                      newTemplateCategory === cat && styles.categorySelectChipSelected,
                    ]}
                    onPress={() => setNewTemplateCategory(cat)}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[cat]}
                      size={14}
                      color={newTemplateCategory === cat ? '#000000' : CATEGORY_COLORS[cat]}
                    />
                    <Text
                      style={[
                        styles.categorySelectText,
                        newTemplateCategory === cat && styles.categorySelectTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Prompt Template</Text>
            <TextInput
              style={[styles.input, styles.promptInput]}
              value={newTemplatePrompt}
              onChangeText={setNewTemplatePrompt}
              placeholder="Enter your prompt template..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.createModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!newTemplateName.trim() || !newTemplatePrompt.trim()) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleCreateTemplate}
                disabled={!newTemplateName.trim() || !newTemplatePrompt.trim()}
              >
                <Text style={styles.saveButtonText}>Save Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d2818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#ffd700',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  categoryChipTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  templatesList: {
    flex: 1,
    marginBottom: 16,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  templateItem: {
    backgroundColor: '#0a1f1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a3a2a',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#ffd700',
    fontWeight: '600',
  },
  templatePrompt: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0a1f1a',
    borderWidth: 1,
    borderColor: '#1a3a2a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  promptInput: {
    height: 100,
  },
  categorySelectRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a3a2a',
  },
  categorySelectChipSelected: {
    backgroundColor: '#ffd700',
    borderColor: '#ffd700',
  },
  categorySelectText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  categorySelectTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  createModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
