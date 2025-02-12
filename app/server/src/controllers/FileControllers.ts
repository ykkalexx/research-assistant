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
  // It will extract text from the PDF file, summarize the text, extract references, and save the data to the database
  async uploadPdf(req: Request, res: Response): Promise<Response> {
    return new Promise(resolve => {
      upload.single('file')(req, res, async err => {
        try {
          if (err) {
            return resolve(res.status(400).json({ message: err.message }));
          }

          if (!req.file) {
            return resolve(
              res.status(400).json({ message: 'No file uploaded' })
            );
          }

          // Process text extraction first
          let text: string;

          try {
            text = await hfService.extractTextFromPDF(req.file.path);
          } catch (error) {
            console.error('Text extraction error:', error);
            return resolve(
              res
                .status(500)
                .json({ message: 'Failed to extract text from PDF' })
            );
          }

          // Process summarization and references sequentially
          let summary: string;
          let references: string[];

          try {
            summary = await hfService.summarizeText(text);
            references = await hfService.extractReferences(text);
          } catch (error) {
            console.error('Processing error:', error);
            return resolve(
              res.status(500).json({ message: 'Failed to process document' })
            );
          }

          // Only proceed if we have both summary and references
          if (!summary || !references) {
            return resolve(
              res
                .status(500)
                .json({ message: 'Failed to generate summary or references' })
            );
          }

          try {
            const [resultHeader] = await db.execute(
              `INSERT INTO documents (original_name, filename, file_path, size, summary, refs, processed, full_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                req.file.originalname,
                req.file.filename,
                req.file.path,
                req.file.size,
                summary,
                JSON.stringify(references),
                true,
                text,
              ]
            );

            return resolve(
              res.status(200).json({
                message: 'File processed successfully',
                document: {
                  summary,
                  references,
                },
              })
            );
          } catch (error) {
            console.error('Database error:', error);
            return resolve(
              res.status(500).json({ message: 'Failed to save to database' })
            );
          }
        } catch (error: any) {
          console.error('Unknown error:', error);
          return resolve(
            res.status(500).json({
              message: error.message || 'An unknown error occurred',
            })
          );
        }
      });
    });
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
