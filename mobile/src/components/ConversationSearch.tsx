import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { conversationsApi, SearchResult } from '../services/api';
import { theme } from '../utils/theme';

interface ConversationSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: number) => void;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  visible,
  onClose,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const response = await conversationsApi.search(query);
      setResults(response.result?.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectConversation(result.conversationId);
    onClose();
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === match.toLowerCase() ? (
        <Text key={i} style={styles.highlight}>{part}</Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectResult(item)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.conversationTitle || 'Untitled Conversation'}
        </Text>
        <Text style={styles.resultDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.roleTag}>
          {item.messageRole === 'user' ? 'YOU' : 'AI'}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {highlightMatch(item.messageContent, item.matchedText)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Conversations</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              placeholder="Search messages..."
              placeholderTextColor={theme.colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.background} />
              ) : (
                <Ionicons name="search" size={20} color={theme.colors.background} />
              )}
            </TouchableOpacity>
          </View>

          {searched && (
            <Text style={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </Text>
          )}

          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => `${item.conversationId}-${item.messageId}`}
            style={styles.resultsList}
            ListEmptyComponent={
              searched && !loading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>Try different keywords</Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  resultDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  highlight: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

export default ConversationSearch;
