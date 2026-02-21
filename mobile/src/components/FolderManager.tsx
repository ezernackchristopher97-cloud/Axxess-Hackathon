import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

const FOLDER_COLORS = [
  '#ffd700', // Gold
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#f472b6', // Pink
  '#fb923c', // Orange
  '#a78bfa', // Purple
  '#f87171', // Red
  '#2dd4bf', // Teal
];

const FOLDER_ICONS: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'folder', icon: 'folder' },
  { name: 'briefcase', icon: 'briefcase' },
  { name: 'person', icon: 'person' },
  { name: 'flask', icon: 'flask' },
  { name: 'star', icon: 'star' },
  { name: 'archive', icon: 'archive' },
  { name: 'book', icon: 'book' },
];

interface Folder {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

interface FolderManagerProps {
  folders: Folder[];
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  onRefresh: () => void;
}

export function FolderManager({
  folders,
  selectedFolderId,
  onSelectFolder,
  onRefresh,
}: FolderManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#ffd700');
  const [newFolderIcon, setNewFolderIcon] = useState('folder');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreating(true);
    try {
      await api.createFolder(newFolderName.trim(), newFolderColor, newFolderIcon);
      setShowCreateModal(false);
      setNewFolderName('');
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    Alert.alert(
      'Delete Folder',
      'Delete this folder? Conversations will be moved to "All Chats".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteFolder(folderId);
              if (selectedFolderId === folderId) {
                onSelectFolder(null);
              }
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete folder');
            }
          },
        },
      ]
    );
  };

  const getIconName = (iconName: string | null): keyof typeof Ionicons.glyphMap => {
    const found = FOLDER_ICONS.find(i => i.name === iconName);
    return found?.icon || 'folder';
  };

  return (
    <View style={styles.container}>
      {/* All Chats */}
      <TouchableOpacity
        style={[
          styles.folderItem,
          selectedFolderId === null && styles.folderItemSelected,
        ]}
        onPress={() => onSelectFolder(null)}
      >
        <Ionicons
          name="folder"
          size={18}
          color={selectedFolderId === null ? '#ffd700' : '#9ca3af'}
        />
        <Text
          style={[
            styles.folderName,
            selectedFolderId === null && styles.folderNameSelected,
          ]}
        >
          All Chats
        </Text>
      </TouchableOpacity>

      {/* Folder List */}
      {folders.map((folder) => (
        <TouchableOpacity
          key={folder.id}
          style={[
            styles.folderItem,
            selectedFolderId === folder.id && styles.folderItemSelected,
          ]}
          onPress={() => onSelectFolder(folder.id)}
          onLongPress={() => handleDeleteFolder(folder.id)}
        >
          <Ionicons
            name={getIconName(folder.icon)}
            size={18}
            color={folder.color || '#ffd700'}
          />
          <Text
            style={[
              styles.folderName,
              selectedFolderId === folder.id && styles.folderNameSelected,
            ]}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
        </TouchableOpacity>
      ))}

      {/* New Folder Button */}
      <TouchableOpacity
        style={styles.newFolderButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={18} color="#6b7280" />
        <Text style={styles.newFolderText}>New Folder</Text>
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>

            <Text style={styles.inputLabel}>Folder Name</Text>
            <TextInput
              style={styles.input}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g., Work, Personal, Research"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.inputLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorRow}>
                {FOLDER_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newFolderColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewFolderColor(color)}
                  />
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Icon</Text>
            <View style={styles.iconRow}>
              {FOLDER_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.iconOption,
                    newFolderIcon === item.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => setNewFolderIcon(item.name)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={newFolderIcon === item.name ? '#ffd700' : '#9ca3af'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!newFolderName.trim() || isCreating) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreating}
              >
                <Text style={styles.createButtonText}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  folderItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  folderName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  folderNameSelected: {
    color: '#ffd700',
  },
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginTop: 4,
  },
  newFolderText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0d2818',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
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
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
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
  createButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
