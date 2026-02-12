import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './api/routes/auth.routes.js';
import serverRoutes from './api/routes/server.routes.js';
import worldsRoutes from './api/routes/worlds.routes.js';
import pluginsRoutes from './api/routes/plugins.routes.js';
import backupsRoutes from './api/routes/backups.routes.js';
import { errorMiddleware, notFoundMiddleware } from './api/middlewares/error.middleware.js';

const app = express();

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de requests por IP
  message: 'Demasiadas peticiones desde esta IP, por favor intenta después'
});
app.use('/api/', generalLimiter);

// Rate limiting para login (más estricto)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login, por favor intenta después'
});
app.use('/api/auth/login', loginLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/worlds', worldsRoutes);
app.use('/api/plugins', pluginsRoutes);
app.use('/api/backups', backupsRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use(notFoundMiddleware);

// Manejo de errores
app.use(errorMiddleware);

export default app;
