import { Agent, AgentResponse } from '../../interfaces/index';
import { OpenAiService } from '../OpenAiService';

export class ReferenceAgent implements Agent {
  private openai: OpenAiService;

  constructor() {
    this.openai = new OpenAiService();
  }

  canHandle(task: string): boolean {
    const refKeywords = ['extract references', 'find references', 'references'];
    return refKeywords.some(keyword => task.toLowerCase().includes(keyword));
  }

  async process(text: string): Promise<AgentResponse> {
    try {
      const refs = await this.openai.extractReferences(text);
      return {
        message: refs.join('\n'),
        confidence: 0.85,
        metadata: {
          type: 'references',
          references: refs,
          count: refs.length,
        },
      };
    } catch (error) {
      throw new Error(`Reference Agent failed: ${error}`);
    }
  }
}
