import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }

    this.openai = new OpenAI({ apiKey });
  }

  async answerQuestions(context: string, question: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'chatgpt-4o-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a research assistant. Answer questions based on the provided research paper context. Be accurate and concise',
          },
          {
            role: 'user',
            content: `Given this research paper content: "${context.slice(0, 2000)}..."

                Question: ${question}

                Please provide a clear and accurate answer based solely on the paper's content.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return (
        response.choices[0].message.content ||
        "I couldn't find a relevant answer in the paper."
      );
    } catch (error) {
      console.error('OpenAI error:', error);
      throw new Error('Failed to get answer from OpenAI');
    }
  }
}
