import { HfInference } from '@huggingface/inference';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class HuggingFaceService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
  }

  // im using this function to extract the text from the pdf file
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await PdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // this function uses Bart to summarize the text from the pdf file
  // Bart is a model that can summarize text from a given input
  async summarizeText(text: string): Promise<string> {
    const response = await this.hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: 500,
        min_length: 100,
      },
    });

    return response.summary_text;
  }

  // this function uses Camembert to extract references from the text
  // Camembert is a model that can extract entities from text
  async extractReferences(text: string): Promise<string[]> {
    const response = await this.hf.tokenClassification({
      model: 'Jean-Baptiste/camembert-ner-with-dates',
      inputs: text,
    });

    // Filter and process references
    const references = response
      .filter(
        item => item.entity_group === 'MISC' || item.entity_group === 'ORG'
      )
      .map(item => item.word);

    return Array.from(new Set(references));
  }

  // this function uses Roberta to answer a question from the text
  async answerQuestion(context: string, question: string): Promise<string> {
    const response = await this.hf.questionAnswer({
      model: 'deepset/roberta-base-squad2',
      inputs: {
        question,
        context,
      },
    });
    return response.answer;
  }
}
