import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://reop-ai.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/trpc/auth.login', {
      json: { email, password },
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/api/trpc/auth.register', {
      json: { name, email, password },
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/trpc/auth.logout');
    await SecureStore.deleteItemAsync('authToken');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/api/trpc/auth.me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/api/trpc/auth.forgotPassword', {
      json: { email },
    });
    return response.data;
  },
};

// Conversations API
export const conversationsApi = {
  list: async () => {
    const response = await api.get('/api/trpc/conversations.list');
    return response.data;
  },

  create: async (title?: string) => {
    const response = await api.post('/api/trpc/conversations.create', {
      json: { title },
    });
    return response.data;
  },

  getMessages: async (conversationId: number) => {
    const response = await api.get(`/api/trpc/conversations.getMessages?input=${encodeURIComponent(JSON.stringify({ conversationId }))}`);
    return response.data;
  },

  sendMessage: async (conversationId: number, content: string, imageUrl?: string) => {
    const response = await api.post('/api/trpc/messages.send', {
      json: { conversationId, content, imageUrl },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.post('/api/trpc/conversations.delete', {
      json: { id },
    });
    return response.data;
  },

  search: async (query: string, startDate?: string, endDate?: string) => {
    const response = await api.get(`/api/trpc/conversations.search?input=${encodeURIComponent(JSON.stringify({ query, startDate, endDate }))}`);
    return response.data;
  },

  getRecent: async (limit?: number) => {
    const response = await api.get(`/api/trpc/conversations.recent?input=${encodeURIComponent(JSON.stringify({ limit: limit || 10 }))}`);
    return response.data;
  },
};

// Subscription API
export const subscriptionApi = {
  getStatus: async () => {
    const response = await api.get('/api/trpc/subscription.getStatus');
    return response.data;
  },

  getUsage: async () => {
    const response = await api.get('/api/trpc/subscription.getUsage');
    return response.data;
  },

  createCheckout: async (billingOption: string) => {
    const response = await api.post('/api/trpc/subscription.createCheckout', {
      json: { billingOption },
    });
    return response.data;
  },
};

// Image Generation API
export const imageApi = {
  generate: async (prompt: string, style?: string) => {
    const response = await api.post('/api/trpc/advanced.generateImage', {
      json: { prompt, style },
    });
    return response.data;
  },

  getHistory: async (limit?: number) => {
    const response = await api.get(`/api/trpc/advanced.getImageHistory?input=${encodeURIComponent(JSON.stringify({ limit: limit || 20 }))}`);
    return response.data;
  },

  getStyles: async () => {
    const response = await api.get('/api/trpc/advanced.getImageStyles');
    return response.data;
  },
};

// OCR API
export const ocrApi = {
  extract: async (imageUrl: string) => {
    const response = await api.post('/api/trpc/ocr.extract', {
      json: { imageUrl },
    });
    return response.data;
  },

  analyze: async (imageUrl: string, question: string) => {
    const response = await api.post('/api/trpc/ocr.analyze', {
      json: { imageUrl, question },
    });
    return response.data;
  },
};

// Voice Transcription API
export const voiceApi = {
  transcribe: async (audioData: string, language?: string) => {
    const response = await api.post('/api/trpc/architecture.transcribeAudio', {
      json: { audioData, language },
    });
    return response.data;
  },
};

// Image Editing API
export const imageEditApi = {
  edit: async (editPrompt: string, originalImageUrl: string, editType?: 'modify' | 'enhance' | 'transform' | 'composite') => {
    const response = await api.post('/api/trpc/images.edit', {
      json: { editPrompt, originalImageUrl, editType },
    });
    return response.data;
  },

  detectEdit: async (message: string) => {
    const response = await api.get(`/api/trpc/images.detectEdit?input=${encodeURIComponent(JSON.stringify({ message }))}`);
    return response.data;
  },
};

// Architecture Stats API (for dashboard)
export const architectureApi = {
  getStats: async () => {
    const response = await api.get('/api/trpc/advanced.architectureStats');
    return response.data;
  },

  getMiddlewareStats: async () => {
    const response = await api.get('/api/trpc/advanced.middlewareStats');
    return response.data;
  },

  getUserProfile: async () => {
    const response = await api.get('/api/trpc/architecture.getUserProfile');
    return response.data;
  },

  exportMetrics: async (format: 'json' | 'markdown') => {
    const response = await api.get(`/api/trpc/architecture.exportMetrics?input=${encodeURIComponent(JSON.stringify({ format }))}`);
    return response.data;
  },

  getNeuralPruningStats: async () => {
    const response = await api.get('/api/trpc/architecture.getNeuralPruningStats');
    return response.data;
  },

  getVicsekStats: async () => {
    const response = await api.get('/api/trpc/architecture.getVicsekStats');
    return response.data;
  },
};

// Types for API responses
export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  regime?: string;
  absurdityScore?: string;
  filtersPassed?: string[];
  consensusData?: any;
  createdAt: string;
  // New fields from middleware
  mirroringStrength?: number;
  compressionRatio?: number;
  generatedImageUrl?: string;
  isImageGeneration?: boolean;
}

export interface Conversation {
  id: number;
  userId: number;
  title: string;
  regime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedImage {
  id: number;
  userId: number;
  conversationId?: number;
  prompt: string;
  optimizedPrompt?: string;
  imageUrl: string;
  style?: string;
  entropyState?: string;
  createdAt: string;
}

export interface ArchitectureStats {
  neural: {
    totalSynapses: number;
    activeSynapses: number;
    prunedSynapses: number;
    averageWeight: number;
  };
  vicsek: {
    orderParameter: number;
    agentCount: number;
    consensusReached: boolean;
  };
  entropy: {
    currentState: string;
    averageEntropy: number;
    mirroringStrength: number;
  };
  memory: {
    compressionRatio: number;
    savedTokens: number;
  };
}

export interface UserProfile {
  formalityScore: number;
  verbosityScore: number;
  technicalityScore: number;
  emotionalityScore: number;
  entropyState: string;
  totalInteractions: number;
  mirroringStrength: number;
}

export default api;

// Notifications API
export const notificationsApi = {
  list: async () => {
    const response = await api.get('/api/trpc/notifications.list');
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.post('/api/trpc/notifications.markAsRead', {
      json: { notificationId },
    });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/trpc/notifications.markAllAsRead');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/trpc/notifications.unreadCount');
    return response.data;
  },
};

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface SearchResult {
  conversationId: number;
  conversationTitle: string;
  messageId: number;
  messageContent: string;
  messageRole: 'user' | 'assistant';
  matchedText: string;
  createdAt: string;
}


// Folders API
export const foldersApi = {
  list: async () => {
    const response = await api.get('/api/trpc/folders.list');
    return response.data?.result?.data?.json || [];
  },

  create: async (name: string, color?: string, icon?: string) => {
    const response = await api.post('/api/trpc/folders.create', {
      json: { name, color, icon },
    });
    return response.data?.result?.data?.json;
  },

  update: async (id: number, name?: string, color?: string, icon?: string) => {
    const response = await api.post('/api/trpc/folders.update', {
      json: { id, name, color, icon },
    });
    return response.data?.result?.data?.json;
  },

  delete: async (id: number) => {
    const response = await api.post('/api/trpc/folders.delete', {
      json: { id },
    });
    return response.data?.result?.data?.json;
  },

  assignConversation: async (conversationId: number, folderId: number | null) => {
    const response = await api.post('/api/trpc/folders.assignConversation', {
      json: { conversationId, folderId },
    });
    return response.data?.result?.data?.json;
  },

  getConversations: async (folderId: number) => {
    const response = await api.get(`/api/trpc/folders.getConversations?input=${encodeURIComponent(JSON.stringify({ folderId }))}`);
    return response.data?.result?.data?.json || [];
  },
};

// Sharing API
export const sharingApi = {
  create: async (conversationId: number, title: string, expiresInDays?: number) => {
    const response = await api.post('/api/trpc/sharing.create', {
      json: { conversationId, title, expiresInDays },
    });
    return response.data?.result?.data?.json;
  },

  getStatus: async (conversationId: number) => {
    const response = await api.get(`/api/trpc/sharing.getStatus?input=${encodeURIComponent(JSON.stringify({ conversationId }))}`);
    return response.data?.result?.data?.json;
  },

  delete: async (shareId: number) => {
    const response = await api.post('/api/trpc/sharing.delete', {
      json: { shareId },
    });
    return response.data?.result?.data?.json;
  },

  getShared: async (token: string) => {
    const response = await api.get(`/api/trpc/sharing.getShared?input=${encodeURIComponent(JSON.stringify({ token }))}`);
    return response.data?.result?.data?.json;
  },

  getMyShares: async () => {
    const response = await api.get('/api/trpc/sharing.getMyShares');
    return response.data?.result?.data?.json || [];
  },
};

// Templates API
export const templatesApi = {
  list: async () => {
    const response = await api.get('/api/trpc/templates.list');
    return response.data?.result?.data?.json || [];
  },

  create: async (name: string, prompt: string, category: string) => {
    const response = await api.post('/api/trpc/templates.create', {
      json: { name, prompt, category },
    });
    return response.data?.result?.data?.json;
  },

  update: async (id: number, name?: string, prompt?: string, category?: string) => {
    const response = await api.post('/api/trpc/templates.update', {
      json: { id, name, prompt, category },
    });
    return response.data?.result?.data?.json;
  },

  delete: async (id: number) => {
    const response = await api.post('/api/trpc/templates.delete', {
      json: { id },
    });
    return response.data?.result?.data?.json;
  },

  getDefaults: async () => {
    const response = await api.get('/api/trpc/templates.getDefaults');
    return response.data?.result?.data?.json || [];
  },
};

// Unified API export for components
export const apiService = {
  // Folders
  getFolders: foldersApi.list,
  createFolder: foldersApi.create,
  updateFolder: foldersApi.update,
  deleteFolder: foldersApi.delete,
  assignConversationToFolder: foldersApi.assignConversation,
  getConversationsByFolder: foldersApi.getConversations,

  // Sharing
  createShare: sharingApi.create,
  getShareStatus: sharingApi.getStatus,
  deleteShare: sharingApi.delete,
  getSharedConversation: sharingApi.getShared,
  getMyShares: sharingApi.getMyShares,

  // Templates
  getTemplates: templatesApi.list,
  createTemplate: templatesApi.create,
  updateTemplate: templatesApi.update,
  deleteTemplate: templatesApi.delete,
  getDefaultTemplates: templatesApi.getDefaults,
};

// Export unified api object for components
export { apiService as api };
