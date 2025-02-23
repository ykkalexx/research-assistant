export interface AgentResponse {
  message?: string;
  confidence: number;
  answer?: string;
  metadata?: {
    type: string;
    questionType?: string;
    wordCount?: number;
  };
}
