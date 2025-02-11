import path from 'path';
import fs from 'fs';

export const storageConfig = {
  uploadDir: path.join(__dirname, '../../storage/uploads'),
  processedDir: path.join(__dirname, '../../storage/processed'),
  cacheDir: path.join(__dirname, '../../storage/cache'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf'],
};

Object.values(storageConfig)
  .filter(path => typeof path === 'string')
  .forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

export default storageConfig;
