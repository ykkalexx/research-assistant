import { upload } from '@/config/multer';
import { Request, Response } from 'express';
import { HuggingFaceService } from '@/services/HuggingFaceService';
import db from '@/config/database';
import { RowDataPacket } from 'mysql2/promise';
import { PdfService } from '@/services/PdfService';

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
const pdf = new PdfService();

export class FileControllers {
  // This method will handle the file upload process
  // It will extract text from the PDF file, summarize the text, extract references, and save the data to the database
  async uploadPdf(req: Request, res: Response): Promise<Response> {
    try {
      // handle file upload
      const uploadResult = await pdf.handleFileUpload(req, res);
      if ('status' in uploadResult) {
        return uploadResult;
      }
      const { file } = uploadResult;

      // process PDF content
      const processResult = await pdf.processPdfContent(file.path);
      if ('status' in processResult) {
        return processResult;
      }
      const { text, summary, references } = processResult;

      // saving to database
      await pdf.saveToDatabase(file, text, summary, references);

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
