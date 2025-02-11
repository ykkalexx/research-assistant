import multer from 'multer';
import path from 'path';
import storageConfig from './storage';

const storage = multer.diskStorage({
  destination: storageConfig.uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: storageConfig.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (storageConfig.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDFs are allowed.'));
    }
  },
});
