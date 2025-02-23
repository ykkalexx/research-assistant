import { upload } from '../config/multer';
import db from '../config/database';
import { Request, Response } from 'express';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import { AgentOrchestrator } from './Agents/AgentOrchestrator';

const agentOrchestrator = new AgentOrchestrator();

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
      const text = await this.extractTextFromPDF(filePath);
      const summary = await agentOrchestrator.processRequest(
        'generate summary of this text',
        text
      );
      const references = await agentOrchestrator.processRequest(
        'find references in this document',
        text
      );

      if (!summary || !references) {
        throw new Error('Failed to generate summary or references');
      }

      return {
        text,
        summary: summary.message,
        references: references.metadata?.references || [],
      };
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
      const [result] = await db.query(
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

      //@ts-ignore
      return result.insertId;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await PdfParse(dataBuffer, {
        pagerender: this.renderPage,
      });
      return this.cleanExtractedText(data.text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII characters
      .trim();
  }

  private renderPage(pageData: any) {
    const renderOptions = {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(renderOptions).then((textContent: any) => {
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
}
