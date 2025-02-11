import express from 'express';
import { connectDB } from './config/database';
import router from './router';

const app = express();

//middleware
app.use(express.json());

// router
app.use('/api', router);

// db connection with proper async handling
const startServer = async () => {
  try {
    await connectDB;

    app.listen(3000, () => {
      console.log('Server is running on port 8000');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
