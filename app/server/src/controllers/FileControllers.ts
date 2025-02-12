import { upload } from '@/config/multer';
import { Request, Response } from 'express';
import { HuggingFaceService } from '@/services/HuggingFaceService';
import db from '@/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Define interfaces for type safety
interface DocumentRow extends RowDataPacket {
  id: number;
  full_text: string;
  summary: string;
  refs: string;
  original_name: string;
  filename: string;
  file_path: string;
  size: number;
  processed: boolean;
}

const hfService = new HuggingFaceService();

export class FileControllers {
  // This method will handle the file upload process
  private async handleFileUpload(
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
  private async processPdfContent(
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

  private async saveToDatabase(
    file: Express.Multer.File,
    text: string,
    summary: string,
    references: string[]
  ): Promise<void> {
    try {
      await db.execute(
        `INSERT INTO documents (original_name, filename, file_path, size, summary, refs, processed, full_text) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file.originalname,
          file.filename,
          file.path,
          file.size,
          summary,
          JSON.stringify(references),
          true,
          text,
        ]
      );
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // This method will handle the file upload process
  // It will extract text from the PDF file, summarize the text, extract references, and save the data to the database
  async uploadPdf(req: Request, res: Response): Promise<Response> {
    try {
      // Step 1: Handle file upload
      const uploadResult = await this.handleFileUpload(req, res);
      if ('status' in uploadResult) {
        return uploadResult;
      }
      const { file } = uploadResult;

      // Step 2: Process PDF content
      const processResult = await this.processPdfContent(file.path);
      if ('status' in processResult) {
        return processResult;
      }
      const { text, summary, references } = processResult;

      // Step 3: Save to database
      await this.saveToDatabase(file, text, summary, references);

      // Return success response
      return res.status(200).json({
        message: 'File processed successfully',
        document: {
          summary,
          references,
        },
      });
    } catch (error: any) {
      console.error('Error in uploadPdf:', error);
      return res.status(500).json({
        message: error.message || 'An unknown error occurred',
      });
    }
  }

  async askQuestion(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId, question } = req.body;

      if (!documentId || !question) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      //@ts-ignore
      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT * FROM documents WHERE id = ?',
        [documentId]
      );

      const document = rows[0];

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const answer = await hfService.answerQuestion(
        document.full_text,
        question
      );

      return res.status(200).json({ answer });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }
}
