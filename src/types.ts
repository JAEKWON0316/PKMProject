// import { SummaryResult } from '@/lib/utils/openai';

export enum ChatSource {
  CHATGPT = 'chatgpt',
  USER_INPUT = 'user_input',
  API = 'api',
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
  function_call?: any;
}

export interface Conversation {
  id?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date | string;
  source: ChatSource;
  tags?: string[];
  metadata?: Record<string, any>;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  duplicate?: boolean;
}

export interface SummaryResult {
  summary: string;
  keywords: string[];
  modelUsed: string;
}

export interface ChatChunk {
  id: string;
  chat_session_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  similarity?: number;
}

export interface ChatSession {
  id?: string;
  title?: string;
  url?: string;
  summary?: string;
  messages?: ChatMessage[];
  metadata?: Record<string, any>;
  created_at?: string;
  embedding?: number[];
  user_id?: string | null;
}

export interface RagSource {
  id?: string;
  title?: string;
  url?: string;
  similarity?: number;
}

export interface RagResponse {
  answer: string;
  summary?: string;
  sources: RagSource[];
  hasSourceContext?: boolean;
}

export interface SaveOptions {
  saveToSupabase?: boolean;
  saveToObsidian?: boolean;
  saveAsJson?: boolean;
  skipDuplicateCheck?: boolean;
} 