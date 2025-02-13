import express from 'express';
import db from './config/database';
import router from './router';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './middleware/session';

const app = express();

// Configure CORS with specific options
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// cors config
app.use(cors(corsOptions));

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

// router
app.use('/api', router);

// db connection with proper async handling
const startServer = async () => {
  try {
    await db.getConnection();
    console.log('Connected to database');

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
