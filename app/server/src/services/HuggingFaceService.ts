import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

export class HuggingFaceService {
  private hf: HfInference;
  private maxInputLength = 500;

  constructor() {
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    if (!hfApiKey) {
      throw new Error('HUGGING_FACE_API_KEY is not defined');
    }
    this.hf = new HfInference(hfApiKey);
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

  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n\s*\n/);

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

  private cleanReference(ref: string): string {
    return ref
      .replace(/[\[\]()]/g, '')
      .replace(/^\d+\.\s*/, '')
      .trim();
  }
}
