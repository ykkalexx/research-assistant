import { Agent, AgentResponse } from '../../interfaces/index';
import { OpenAiService } from '../OpenAiService';

export class QAAgent implements Agent {
  private openai: OpenAiService;

  constructor() {
    this.openai = new OpenAiService();
  }

  canHandle(task: string): boolean {
    return (
      task.trim().endsWith('?') ||
      task.toLowerCase().startsWith('what') ||
      task.toLowerCase().startsWith('how') ||
      task.toLowerCase().startsWith('why')
    );
  }

  async process(question: string, context: string): Promise<AgentResponse> {
    try {
      const answer = await this.openai.answerQuestions(context, question);
      return {
        message: answer,
        confidence: 0.85,
        metadata: {
          type: 'qa',
          questionType: this.determineQuestionType(question),
        },
      };
    } catch (error) {
      throw new Error(`QA Agent failed: ${error}`);
    }
  }

  private determineQuestionType(question: string): string {
    if (question.toLowerCase().startsWith('what')) return 'what';
    if (question.toLowerCase().startsWith('how')) return 'how';
    if (question.toLowerCase().startsWith('why')) return 'why';
    return 'other';
  }
}
