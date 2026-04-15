import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeWebSocket } from './services/websocket';

// Configuración
import { initDB } from './config/database';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Rutas
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import productRoutes from './routes/products';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Inicializar WebSocket
initializeWebSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CercaYa API',
    version: '1.0.0',
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);

// 404
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos
    await initDB();

    httpServer.listen(PORT, () => {
      console.log(`
🚀 ╔════════════════════════════════════════╗
🚀 ║     CercaYa API corriendo en           ║
🚀 ║     http://localhost:${PORT}            ║
🚀 ╚════════════════════════════════════════╝
      `);
      console.log('📡 WebSocket inicializado');
      console.log('📝 Press CTRL+C para detener');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
