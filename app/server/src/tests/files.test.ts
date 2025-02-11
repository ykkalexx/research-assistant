import { FileControllers } from '@/controllers/FileControllers';
import { Request, Response } from 'express';
import { HuggingFaceService } from '@/services/HuggingFaceService';
import db from '@/config/database';
import { Readable } from 'stream';

// Mock dependencies
jest.mock('@/services/HuggingFaceService');
jest.mock('@/config/database');
jest.mock('@/config/multer', () => ({
  upload: {
    single: jest.fn().mockImplementation(() => {
      return (req: any, res: any, cb: any) => cb(null);
    }),
  },
}));

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
      // Mock HuggingFaceService methods
      const mockText = 'Extracted text';
      const mockSummary = 'Summary of the text';
      const mockReferences = ['ref1', 'ref2'];

      (
        HuggingFaceService.prototype.extractTextFromPDF as jest.Mock
      ).mockResolvedValue(mockText);
      (
        HuggingFaceService.prototype.summarizeText as jest.Mock
      ).mockResolvedValue(mockSummary);
      (
        HuggingFaceService.prototype.extractReferences as jest.Mock
      ).mockResolvedValue(mockReferences);

      // Mock database execute
      (db.execute as jest.Mock).mockResolvedValue([{ insertId: 1 }]);

      const response = await fileControllers.uploadPdf(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File processed successfully',
        document: {
          id: 1,
          summary: mockSummary,
          references: mockReferences,
        },
      });
    });

    it('should handle missing file error', async () => {
      mockRequest.file = undefined;

      const response = await fileControllers.uploadPdf(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No file uploaded',
      });
    });
  });

  describe('askQuestion', () => {
    it('should successfully answer a question about a document', async () => {
      const mockDocument = {
        id: 1,
        full_text: 'Sample document text',
      };
      const mockQuestion = 'What is this about?';
      const mockAnswer = 'This is about a sample document';

      mockRequest.body = { documentId: 1, question: mockQuestion };

      // Mock database query
      (db.execute as jest.Mock).mockResolvedValue([[mockDocument]]);

      // Mock HuggingFaceService answerQuestion
      (
        HuggingFaceService.prototype.answerQuestion as jest.Mock
      ).mockResolvedValue(mockAnswer);

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

    it('should handle document not found', async () => {
      mockRequest.body = { documentId: 999, question: 'test question' };

      // Mock database query returning no results
      (db.execute as jest.Mock).mockResolvedValue([[]]);

      await fileControllers.askQuestion(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Document not found',
      });
    });
  });
});
