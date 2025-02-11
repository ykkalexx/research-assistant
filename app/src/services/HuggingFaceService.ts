import { HfInference } from '@huggingface/inference';
import * as pdfParse from 'pdf-parse';
import fs from 'fs';

export class HuggingFaceService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
  }
}
