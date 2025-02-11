import { upload } from '@/config/multer';
import { Request, Response } from 'express';

export class FileControllers {
  // controller used to upload a pdf file
  async uploadPdf(req: Request, res: Response) {
    try {
      const uploadMiddleware = upload.single('file');

      uploadMiddleware(req, res, async err => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        // file info for the database
        const fileInfo = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          uploadDate: new Date(),
        };

        // TODO: Add file info to the database

        // TODO: Once the AI integration is done, send the file to the AI service

        res.status(200).json({
          message: 'File uploaded successfully',
          file: fileInfo,
        });
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  }

  // controller used to fetch all the information from ai
  async fetchAllInfo(req: Request, res: Response) {}

  // controller used to fetch references from the database
  async fetchReferences(req: Request, res: Response) {}
}
