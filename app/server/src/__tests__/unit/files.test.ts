import { FileControllers } from '../../controllers/FileControllers';
import { Request, Response } from 'express';
import { PdfService } from '../../services/PdfService';
import { OpenAiService } from '../../services/OpenAiService';
import db from '../../config/database';
import { Readable } from 'stream';

// Mock dependencies
jest.mock('../../services/PdfService');
jest.mock('../../services/OpenAiService');
jest.mock('../../config/database');

describe('FileControllers', () => {
  let fileControllers: FileControllers;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    fileControllers = new FileControllers();
    mockRequest = {
      file: {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: '/tmp',
        filename: 'test-123.pdf',
        path: '/tmp/test-123.pdf',
        size: 1024,
        stream: new Readable(),
        buffer: Buffer.from('test'),
      },

      sessionId: 'test-session-id',
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('uploadPdf', () => {
    it('should successfully upload and process a PDF file', async () => {
      // Mock PdfService methods
      const mockProcessResult = {
        text: 'Extracted text',
        summary: 'Summary of the text',
        references: ['ref1', 'ref2'],
      };

      (PdfService.prototype.handleFileUpload as jest.Mock).mockResolvedValue({
        file: mockRequest.file,
      });
      (PdfService.prototype.processPdfContent as jest.Mock).mockResolvedValue(
        mockProcessResult
      );
      (PdfService.prototype.saveToDatabase as jest.Mock).mockResolvedValue(1);

      await fileControllers.uploadPdf(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File processed successfully',
        document: {
          id: 1,
          summary: mockProcessResult.summary,
          references: mockProcessResult.references,
        },
      });
    });

    it('should handle file upload errors', async () => {
      (PdfService.prototype.handleFileUpload as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      await fileControllers.uploadPdf(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Upload failed',
      });
    });
  });

  describe('askQuestion', () => {
    it('should successfully answer a question', async () => {
      const mockQuestion = 'What is this about?';
      const mockAnswer = 'This is about testing';
      mockRequest.body = { documentId: 1, question: mockQuestion };

      (db.execute as jest.Mock).mockResolvedValue([
        [
          {
            id: 1,
            full_text: 'Sample text',
          },
        ],
      ]);

      (OpenAiService.prototype.answerQuestions as jest.Mock).mockResolvedValue(
        mockAnswer
      );

      await fileControllers.askQuestion(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        answer: mockAnswer,
      });
    });

    it('should handle missing parameters', async () => {
      mockRequest.body = {};

      await fileControllers.askQuestion(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required parameters',
      });
    });
  });

  describe('fetchSummaryById', () => {
    it('should return summary for valid document', async () => {
      const mockSummary = 'Test summary';
      mockRequest.body = { id: 1 };

      (db.execute as jest.Mock).mockResolvedValue([
        [
          {
            summary: mockSummary,
          },
        ],
      ]);

      await fileControllers.fetchSummaryById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        summary: mockSummary,
      });
    });

    it('should handle document not found', async () => {
      mockRequest.body = { id: 999 };
      (db.execute as jest.Mock).mockResolvedValue([[]]);

      await fileControllers.fetchSummaryById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Document not found',
      });
    });
  });

  describe('fetchReferencesById', () => {
    it('should return references for valid document', async () => {
      const mockRefs = ['ref1', 'ref2'];
      mockRequest.body = { id: 1 };

      (db.execute as jest.Mock).mockResolvedValue([
        [
          {
            refs: JSON.stringify(mockRefs),
          },
        ],
      ]);

      await fileControllers.fetchReferencesById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        summary: JSON.stringify(mockRefs),
      });
    });
  });

  describe('fetchDocumentsBySessionId', () => {
    it('should return all documents for session', async () => {
      const mockDocs = [
        { id: 1, name: 'doc1' },
        { id: 2, name: 'doc2' },
      ];

      (db.execute as jest.Mock).mockResolvedValue([mockDocs]);

      await fileControllers.fetchDocumentsBySessionId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        documents: mockDocs,
      });
    });

    it('should handle missing session', async () => {
      //@ts-ignore - fuck you ts
      mockRequest.sessionId = undefined;

      await fileControllers.fetchDocumentsBySessionId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No session found',
      });
    });
  });
});
