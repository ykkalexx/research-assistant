import { Request, Response } from 'express';
import db from '../config/database';
import { OpenAiService } from '../services/OpenAiService';
import { PdfService } from '../services/PdfService';
import { io } from '../index';
import { DocumentRow } from '../interfaces';
import { AgentOrchestrator } from '../services/Agents/AgentOrchestrator';

interface SessionRequest extends Request {
  sessionId?: string;
}

const pdf = new PdfService();
const openai = new OpenAiService();
const agentOrchestrator = new AgentOrchestrator();

export class FileControllers {
  // This method will handle the file upload process
  async uploadPdf(req: SessionRequest, res: Response): Promise<Response> {
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
      const docId = await pdf.saveToDatabase(
        file,
        text,
        summary,
        references,
        req.sessionId!
      );

      // Emit upload complete event
      io.emit('upload_complete', {
        id: docId,
        summary,
        references,
      });

      // Return success response
      return res.status(200).json({
        message: 'File processed successfully',
        document: {
          id: docId,
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

  // This method will handle the ask question process
  // It will extract the answer from the document using OpenAi api
  async askQuestion(req: SessionRequest, res: Response): Promise<Response> {
    try {
      const { documentId, question } = req.body;

      if (!documentId || !question) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT * FROM documents WHERE id = ? AND session_id = ?',
        [documentId, req.sessionId]
      );

      const document = rows[0];

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Use OpenAI instead of HuggingFace
      const answer = await openai.answerQuestions(document.full_text, question);

      return res.status(200).json({ answer });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }

  async fetchSummaryById(req: SessionRequest, res: Response) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Missing 'id' parameter" });
      }

      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT summary FROM documents WHERE id = ? AND session_id = ?',
        [id, req.sessionId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'Document not found' });
      }

      return res.status(200).json({ summary: rows[0].summary });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }

  async fetchReferencesById(req: SessionRequest, res: Response) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Missing 'id' parameter" });
      }

      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT summary FROM documents WHERE id = ? AND session_id = ?',
        [id, req.sessionId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'Document not found' });
      }

      return res.status(200).json({ summary: rows[0].refs });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }

  async fetchDocumentsBySessionId(req: SessionRequest, res: Response) {
    try {
      if (!req.sessionId) {
        return res.status(400).json({ message: 'No session found' });
      }

      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT * FROM documents WHERE session_id = ?',
        [req.sessionId]
      );

      return res.status(200).json({ documents: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }

  async generateCitation(req: SessionRequest, res: Response) {
    try {
      const { id, style } = req.body;

      if (!id || !style) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const [rows] = await db.execute<DocumentRow[]>(
        'SELECT * FROM documents WHERE id = ? AND session_id = ?',
        [id, req.sessionId]
      );

      const document = rows[0];
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const result = await agentOrchestrator.processRequest(
        `generate citation in ${style} style`,
        document.full_text
      );

      return res.status(200).json({
        citation: result.message,
        confidence: result.confidence,
        metadata: result.metadata,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }
}
