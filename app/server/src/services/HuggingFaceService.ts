import { HfInference } from '@huggingface/inference';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class HuggingFaceService {
  private hf: HfInference;
  private maxInputLength = 1024; // for Bart and Camembert
  private maxRetries = 3; // max number of retries
  private retryDelay = 1000; // 1 secs

  constructor() {
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'HUGGING_FACE_API_KEY is not defined in environment variables'
      );
    }

    this.hf = new HfInference(apiKey);
  }

  // helper function to retry a function call
  // this function will retry the function call up to maxRetries times
  // with a delay of retryDelay milliseconds between each retry
  // if the function call fails, it will throw an error
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

  // Helper method to split text into manageable chunks
  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.maxInputLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  // im using this function to extract the text from the pdf file
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await PdfParse(dataBuffer);
      console.log('extracted text from pdf file succesfully');
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // this function uses Bart to summarize the text from the pdf file
  // Bart is a model that can summarize text from a given input
  async summarizeText(text: string): Promise<string> {
    try {
      const chunks = this.splitTextIntoChunks(text);
      const summaries: string[] = [];

      // Process chunks with better parameters
      for (const chunk of chunks) {
        try {
          const result = await this.retry(async () => {
            const response = await this.hf.summarization({
              model: 'facebook/bart-large-cnn',
              inputs: chunk,
              parameters: {
                max_length: 250, // Increased for more detailed summaries
                min_length: 50,
                top_p: 0.9, // Nucleus sampling for better coherence
                top_k: 50, // Top-k sampling for diversity
                temperature: 0.8, // Slightly increased creativity
                repetition_penalty: 1.5, // Avoid repetition
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

      return summaries.join(' ');
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  // this function uses Camembert to extract references from the text
  // Camembert is a model that can extract entities from text
  async extractReferences(text: string): Promise<string[]> {
    try {
      console.log('hit 3');
      // Process text in chunks to avoid token limits
      const chunks = this.splitTextIntoChunks(text);
      const allReferences: string[] = [];

      for (const chunk of chunks) {
        const response = await this.hf.tokenClassification({
          model: 'Jean-Baptiste/camembert-ner-with-dates',
          inputs: chunk,
        });

        const references = response
          .filter(
            item =>
              item.entity_group === 'MISC' ||
              item.entity_group === 'ORG' ||
              item.entity_group === 'PER'
          )
          .map(item => item.word);

        allReferences.push(...references);
      }

      console.log('extractReferences succesfully');
      // Remove duplicates and return
      return Array.from(new Set(allReferences));
    } catch (error) {
      console.error('Reference extraction error:', error);
      throw new Error('Failed to extract references');
    }
  }

  // this function uses Roberta model to answer a question from the text
  async answerQuestion(context: string, question: string): Promise<string> {
    try {
      // Use a more focused context window around potential answers
      const chunks = this.splitTextIntoChunks(context);
      const answers: string[] = [];

      for (const chunk of chunks) {
        const response = await this.hf.questionAnswer({
          model: 'deepset/roberta-base-squad2',
          inputs: {
            question,
            context: chunk,
          },
        });

        if (response.answer && response.answer.trim()) {
          answers.push(response.answer);
        }
      }

      // Combine and return the best answer
      return answers.length > 0
        ? answers.reduce((a, b) => (a.length > b.length ? a : b))
        : "I couldn't find a specific answer to that question in the document.";
    } catch (error) {
      console.error('Question answering error:', error);
      throw new Error('Failed to answer question');
    }
  }
}
