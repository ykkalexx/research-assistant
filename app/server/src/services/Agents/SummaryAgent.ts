import { Agent, AgentResponse } from '../../interfaces/index';
import { OpenAiService } from '../OpenAiService';

export class SummaryAgent implements Agent {
  private openai: OpenAiService;

  constructor() {
    this.openai = new OpenAiService();
  }

  canHandle(task: string): boolean {
    const summaryKeywords = [
      'summarize',
      'summary',
      'brief',
      'overview',
      'generate summary',
    ];
    return summaryKeywords.some(keyword =>
      task.toLowerCase().includes(keyword)
    );
  }

  async process(text: string): Promise<AgentResponse> {
    try {
      const summary = await this.openai.summarizeText(text);
      return {
        message: summary,
        confidence: 0.9,
        metadata: {
          type: 'summary',
          wordCount: summary.split(' ').length,
        },
      };
    } catch (error) {
      throw new Error(`Summary Agent failed: ${error}`);
    }
  }
}
