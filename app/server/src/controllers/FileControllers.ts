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

export class FileControllers {
  private hfService: HuggingFaceService;

  constructor() {
    this.hfService = new HuggingFaceService();
  }

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

          const text = await this.hfService.extractTextFromPDF(req.file.path);

          const [summary, references] = await Promise.all([
            this.hfService.summarizeText(text),
            this.hfService.extractReferences(text),
          ]);

          //@ts-ignore
          const [result] = await db.execute<ResultSetHeader>(
            `
            INSERT INTO documents 
            (original_name, filename, file_path, size, summary, refs, processed, full_text) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
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
                id: result.insertId,
                summary,
                references,
              },
            })
          );
        } catch (error) {
          console.error(error);
          return resolve(
            res.status(500).json({
              message:
                error instanceof Error
                  ? error.message
                  : 'An unknown error occurred',
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

      const answer = await this.hfService.answerQuestion(
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
