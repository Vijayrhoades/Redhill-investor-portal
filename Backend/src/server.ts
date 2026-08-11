import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { seedData } from './config/seed.js';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// Enable CORS & body parsing
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Static Uploads Serving
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize Database Seed Data
seedData();

// Register Routes
app.use(routes);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Express server running on http://localhost:${PORT}`);
});
