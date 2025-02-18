import { HfInference } from '@huggingface/inference';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

export class HuggingFaceService {
  private hf: HfInference;
  private openai: OpenAI;

  private maxInputLength = 500;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!hfApiKey || !openaiApiKey) {
      throw new Error('API keys not defined');
    }

    this.hf = new HfInference(hfApiKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === this.maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw new Error('Max retries reached');
  }

  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n\s*\n/); // Split by paragraphs instead of sentences

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      if ((currentChunk + trimmed).length > this.maxInputLength) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await PdfParse(dataBuffer, {
        pagerender: render_page, // i am using a custom  renderer for better text extraction
      });
      return this.cleanExtractedText(data.text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
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
            content: `Please summarize this academic text:\n\n${text}`,
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

  async extractReferences(text: string): Promise<string[]> {
    try {
      const chunks = this.splitTextIntoChunks(text);
      const allReferences = new Set<string>();

      for (const chunk of chunks) {
        const [nerResult, miscResult] = await Promise.all([
          this.hf.tokenClassification({
            model: 'Jean-Baptiste/camembert-ner-with-dates',
            inputs: chunk,
          }),
          this.hf.tokenClassification({
            model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
            inputs: chunk,
          }),
        ]);

        // combines results from both models
        const references = [...nerResult, ...miscResult]
          .filter(item =>
            [
              'MISC',
              'ORG',
              'PER',
              'LOC',
              'PERSON',
              'ORG',
              'WORK_OF_ART',
            ].includes(item.entity_group)
          )
          .map(item => this.cleanReference(item.word));

        references.forEach(ref => allReferences.add(ref));
      }

      return Array.from(allReferences);
    } catch (error) {
      console.error('Reference extraction error:', error);
      throw new Error('Failed to extract references');
    }
  }

  private cleanReference(ref: string): string {
    return ref
      .replace(/[\[\]()]/g, '') // removes brackets and parentheses
      .replace(/^\d+\.\s*/, '') // removes leading numbers and dots
      .trim();
  }
}

// created a custom page renderer for PDF extraction
// this will help in maintaining the text structure
// and avoid combining text items that are not in the same line
function render_page(pageData: any) {
  let render_options = {
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  };
  return pageData.getTextContent(render_options).then(function (
    textContent: any
  ) {
    let lastY,
      text = '';
    for (let item of textContent.items) {
      if (lastY == item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  });
}
