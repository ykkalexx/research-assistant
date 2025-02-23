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
