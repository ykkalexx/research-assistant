import express from 'express';
import { FileControllers } from '@/controllers/FileControllers';

const router = express.Router();
const files = new FileControllers();

router.post('/upload', files.uploadPdf);
router.post('/question', files.askQuestion);
router.get('/init-session', (req, res) => {
  res.status(200).json({ message: 'Session initialized' });
});

export default router;
