import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import roomRoutes from './routes/rooms.js';
import { handleSocketConnection } from './socket/socketHandler.js';
import { initInMemoryStorage } from './utils/inMemoryStorage.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://syncroom-three.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed, using in-memory storage:', error.message);
    initInMemoryStorage();
    return false;
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  const mongoConnected = await connectDB();
  if (!mongoConnected) {
    console.log('Running with in-memory storage - data will not persist between restarts');
  }
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();