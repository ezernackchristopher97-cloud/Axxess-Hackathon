import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Share,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface ShareConversationProps {
  conversationId: number;
  conversationTitle: string;
}

interface ShareStatus {
  id: number;
  shareToken: string;
  viewCount: number;
  expiresAt: string | null;
}

export function ShareConversation({
  conversationId,
  conversationTitle,
}: ShareConversationProps) {
  const [showModal, setShowModal] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (showModal) {
      loadShareStatus();
    }
  }, [showModal, conversationId]);

  const loadShareStatus = async () => {
    setIsLoading(true);
    try {
      const status = await api.getShareStatus(conversationId);
      setShareStatus(status);
    } catch (error) {
      setShareStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    try {
      await api.createShare(conversationId, conversationTitle, expiresInDays);
      await loadShareStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to create share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShare = () => {
    if (!shareStatus) return;
    
    Alert.alert(
      'Remove Share Link',
      'Anyone with the link will no longer be able to view this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteShare(shareStatus.id);
              setShareStatus(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove share link');
            }
          },
        },
      ]
    );
  };

  const getShareUrl = () => {
    if (!shareStatus?.shareToken) return '';
    return `https://reop-ai.com/shared/${shareStatus.shareToken}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = getShareUrl();
    try {
      await Share.share({
        message: `Check out this conversation: ${url}`,
        url: url,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handlePreview = () => {
    const url = getShareUrl();
    Linking.openURL(url);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="share-outline" size={20} color="#9ca3af" />
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
                <Ionicons name="share-social" size={20} color="#ffd700" />
                <Text style={styles.modalTitle}>Share Conversation</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : shareStatus ? (
              // Already shared
              <View style={styles.sharedContent}>
                <View style={styles.linkContainer}>
                  <View style={styles.linkHeader}>
                    <Ionicons name="link" size={16} color="#ffd700" />
                    <Text style={styles.linkLabel}>Share Link</Text>
                  </View>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {getShareUrl()}
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Views</Text>
                    <Text style={styles.statValue}>{shareStatus.viewCount || 0}</Text>
                  </View>
                  {shareStatus.expiresAt && (
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Expires</Text>
                      <Text style={styles.statValue}>
                        {new Date(shareStatus.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopyLink}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={20}
                      color={copied ? '#4ade80' : '#ffffff'}
                    />
                    <Text style={styles.actionButtonText}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handlePreview}
                  >
                    <Ionicons name="open-outline" size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Preview</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteShare}
                >
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
                  <Text style={styles.deleteButtonText}>Remove Share Link</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Not shared yet
              <View style={styles.createContent}>
                <Text style={styles.description}>
                  Create a public link to share this conversation. Anyone with
                  the link can view the conversation (read-only).
                </Text>

                <Text style={styles.inputLabel}>Link expiration (optional)</Text>
                <View style={styles.expirationOptions}>
                  {[7, 30, 90].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.expirationOption,
                        expiresInDays === days && styles.expirationOptionSelected,
                      ]}
                      onPress={() =>
                        setExpiresInDays(expiresInDays === days ? undefined : days)
                      }
                    >
                      <Text
                        style={[
                          styles.expirationOptionText,
                          expiresInDays === days && styles.expirationOptionTextSelected,
                        ]}
                      >
                        {days} days
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.expirationOption,
                      expiresInDays === undefined && styles.expirationOptionSelected,
                    ]}
                    onPress={() => setExpiresInDays(undefined)}
                  >
                    <Text
                      style={[
                        styles.expirationOptionText,
                        expiresInDays === undefined && styles.expirationOptionTextSelected,
                      ]}
                    >
                      Never
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.createShareButton}
                  onPress={handleCreateShare}
                >
                  <Text style={styles.createShareButtonText}>
                    Create Share Link
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shareButton: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  sharedContent: {
    gap: 16,
  },
  linkContainer: {
    backgroundColor: '#0a1f1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a3a2a',
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  linkLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  linkText: {
    fontSize: 14,
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#f87171',
    fontSize: 14,
  },
  createContent: {
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 8,
  },
  expirationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expirationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a3a2a',
    backgroundColor: 'transparent',
  },
  expirationOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#ffd700',
  },
  expirationOptionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  expirationOptionTextSelected: {
    color: '#ffd700',
  },
  createShareButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  createShareButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
