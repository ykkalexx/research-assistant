import express from 'express';
import { FileControllers } from '@/controllers/FileControllers';

const router = express.Router();
const files = new FileControllers();

router.post('/upload', files.uploadPdf);
router.post('/question', files.askQuestion);

export default router;
