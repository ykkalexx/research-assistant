import { RowDataPacket } from 'mysql2/promise';

export interface DocumentAttributes {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  uploadDate: Date;
  summary?: string;
  references?: string[];
  processed: boolean;
}

export interface DocumentRow extends RowDataPacket {
  id: number;
  full_text: string;
  summary: string;
  refs: string;
  original_name: string;
  filename: string;
  file_path: string;
  size: number;
  processed: boolean;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  message: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface Agent {
  process(message: string, context?: any): Promise<AgentResponse>;
  canHandle(task: string): boolean;
}
