export enum ChatSource {
  CHATGPT = 'chatgpt',
  USER_INPUT = 'user_input',
  API = 'api',
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date | string;
  source: ChatSource;
  tags?: string[];
  metadata?: {
    date: string;
    model: string;
    tags: string[];
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  source: ChatSource;
  tags?: string[];
}

export interface Settings {
  obsidianVaultPath: string;
  openaiApiKey: string;
  defaultTags: string[];
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
}; 