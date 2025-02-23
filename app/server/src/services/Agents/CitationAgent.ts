import { Agent, AgentResponse } from '../../interfaces/index';
import { OpenAiService } from '../OpenAiService';

export class CitationAgent implements Agent {
  private openai: OpenAiService;

  constructor() {
    this.openai = new OpenAiService();
  }

  canHandle(task: string): boolean {
    const citationKeywords = ['citation', 'cite', 'generate citation'];
    return citationKeywords.some(keyword =>
      task.toLowerCase().includes(keyword)
    );
  }

  async process(text: string, context?: string): Promise<AgentResponse> {
    try {
      const style = this.extractCitationStyle(text);
      const citation = await this.openai.generateCitation(context || text);

      return {
        message: citation,
        confidence: 0.85,
        metadata: {
          type: 'citation',
          style: style,
        },
      };
    } catch (error) {
      throw new Error(`Citation Agent failed: ${error}`);
    }
  }

  private extractCitationStyle(task: string): string {
    const style = task.match(/in\s+(APA|MLA|Chicago)\s+style/i)?.[1];
    if (style) {
      return style.toUpperCase();
    }
    return 'APA';
  }
}
