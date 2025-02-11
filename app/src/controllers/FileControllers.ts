import { Request, Response } from 'express';

export class FileControllers {
  async uploadPdf(req: Request, res: Response) {
    try {
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  }
}
