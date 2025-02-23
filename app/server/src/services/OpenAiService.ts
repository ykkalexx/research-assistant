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

  async summarizeText(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'chatgpt-4o-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a research assistant that creates concise but informative summaries of academic papers. Focus on key findings, methodology, and conclusions.',
          },
          {
            role: 'user',
            content: `Please summarize this academic text:\n\n${text}. Do not return it in markdown format, just plain text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return (
        response.choices[0].message.content || 'Failed to generate summary'
      );
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async generateCitation(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'chatgpt-4o-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a research assistant that creates citations for academic papers. Please provide the citation ',
          },
          {
            role: 'user',
            content: `Please provide citation for this academic text:\n\n${text}. Do not return it in markdown format, just plain text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      return (
        response.choices[0].message.content || 'Failed to generate citations'
      );
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async extractReferences(text: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'chatgpt-4o-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a research assistant that extracts references from academic texts. Return only the references list.',
          },
          {
            role: 'user',
            content: `Extract all references from this text:\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) return [];

      // Split into array and clean up
      return content
        .split('\n')
        .filter(ref => ref.trim().length > 0)
        .map(ref => ref.trim());
    } catch (error) {
      console.error('OpenAI reference extraction error:', error);
      throw new Error('Failed to extract references');
    }
  }
}
