import express from 'express';
import { FileControllers } from '@/controllers/FileControllers';

const router = express.Router();
const files = new FileControllers();

// This route is used to upload a PDF file and ask a question
router.post('/upload', files.uploadPdf);
router.post('/question', files.askQuestion);
router.get('/documents', files.fetchDocumentsBySessionId);
router.post('/refs', files.fetchReferencesById);
router.post('/summary', files.fetchSummaryById);

// This route is used to initialize the session for cookies based session management
router.get('/init-session', (req, res) => {
  res.status(200).json({ message: 'Session initialized' });
});

export default router;
