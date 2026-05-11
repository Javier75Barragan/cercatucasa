import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeWebSocket } from './services/websocket';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Configuración
import { initDB } from './config/database';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Rutas
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import productRoutes from './routes/products';
import notificationRoutes from './routes/notifications';
import incidentRoutes from './routes/incidents';

dotenv.config();

// Validación de seguridad crítica
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR FATAL: JWT_SECRET no está configurado en el entorno.');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ ADVERTENCIA: JWT_SECRET es muy corto. Se recomiendan al menos 32 caracteres.');
}

const app: Application = express();
const httpServer = createServer(app);

// Inicializar WebSocket
initializeWebSocket(httpServer);

// Middleware
app.use(helmet());

// Configuración de CORS segura y flexible
const allowedOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.replace(/\/$/, '') : 'http://localhost:5173';

app.use(cors({
  origin: [
    allowedOrigin,
    'https://cercatucasa.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
}));

console.log('🔒 CORS: Seguridad restaurada para:', allowedOrigin);
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
app.use('/api/incidents', incidentRoutes);

// Documentación
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
