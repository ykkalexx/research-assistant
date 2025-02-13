import { upload } from '@/config/multer';
import db from '@/config/database';
import { Request, Response } from 'express';
import { HuggingFaceService } from '@/services/HuggingFaceService';

const hfService = new HuggingFaceService();

export class PdfService {
  async handleFileUpload(
    req: Request,
    res: Response
  ): Promise<{ file: Express.Multer.File } | Response> {
    return new Promise(resolve => {
      upload.single('file')(req, res, err => {
        if (err) {
          resolve(res.status(400).json({ message: err.message }));
          return;
        }

        if (!req.file) {
          resolve(res.status(400).json({ message: 'No file uploaded' }));
          return;
        }

        resolve({ file: req.file });
      });
    });
  }

  // Process the PDF file and extract necessary information
  async processPdfContent(
    filePath: string
  ): Promise<
    { text: string; summary: string; references: string[] } | Response
  > {
    try {
      const text = await hfService.extractTextFromPDF(filePath);
      const summary = await hfService.summarizeText(text);
      const references = await hfService.extractReferences(text);

      if (!summary || !references) {
        throw new Error('Failed to generate summary or references');
      }

      return { text, summary, references };
    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  }

  async saveToDatabase(
    file: Express.Multer.File,
    text: string,
    summary: string,
    references: string[],
    sessionId: string
  ): Promise<void> {
    try {
      await db.execute(
        `INSERT INTO documents (
          original_name, filename, file_path, size, 
          summary, refs, processed, full_text, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file.originalname,
          file.filename,
          file.path,
          file.size,
          summary,
          JSON.stringify(references),
          true,
          text,
          sessionId,
        ]
      );
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}
