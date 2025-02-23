import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './middleware/session';
import db from './config/database';
import router from './router';
import { AgentOrchestrator } from './services/Agents/AgentOrchestrator';

const app = express();
const httpServer = createServer(app);
const agentOrchestrator = new AgentOrchestrator();

// local: http://localhost:5173
// production: https://research-assistant-production-7be0.up.railway.app

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', socket => {
  console.log('Client connected');

  socket.on('process_task', async (data: { task: string; context: string }) => {
    try {
      const result = await agentOrchestrator.processRequest(
        data.task,
        data.context
      );
      socket.emit('task_result', result);
    } catch (error) {
      socket.emit('task_error', {
        message: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export { io };

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(sessionMiddleware);
app.use('/api', router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);
  res.status(400).json({ error: 'Something went wrong!' });
});

const startServer = async () => {
  try {
    await db.getConnection();
    console.log('Connected to database');

    const PORT = 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
