import { HfInference } from '@huggingface/inference';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class HuggingFaceService {
  private hf: HfInference;
  private maxInputLength = 1024;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGING_FACE_API_KEY is not defined');
    }
    this.hf = new HfInference(apiKey);
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
      .replace(/\s+/g, ' ') // replaces  multiple spaces with single space
      .replace(/\n+/g, '\n') // replaces multiple newlines with single newline
      .replace(/[^\x20-\x7E\n]/g, '') // removes  non-ASCII characters
      .trim();
  }

  async summarizeText(text: string): Promise<string> {
    try {
      const chunks = this.splitTextIntoChunks(text);
      const summaries: string[] = [];

      for (const chunk of chunks) {
        try {
          const result = await this.retry(async () => {
            const response = await this.hf.summarization({
              model: 'facebook/bart-large-cnn',
              inputs: chunk,
              parameters: {
                max_length: 250,
                min_length: 50,
                top_p: 0.9,
                top_k: 50,
                temperature: 0.8,
                repetition_penalty: 1.5,
              },
            });
            return response.summary_text;
          });

          if (result) summaries.push(result);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Chunk summarization error:', error);
          continue;
        }
      }

      return this.postProcessSummary(summaries.join(' '));
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  private postProcessSummary(summary: string): string {
    return summary
      .replace(/\s+/g, ' ')
      .replace(/\s+\./g, '.')
      .replace(/\s+,/g, ',')
      .trim();
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
