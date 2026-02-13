import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './api/routes/auth.routes.js';
import serverRoutes from './api/routes/server.routes.js';
import worldsRoutes from './api/routes/worlds.routes.js';
import pluginsRoutes from './api/routes/plugins.routes.js';
import backupsRoutes from './api/routes/backups.routes.js';
import configRoutes from './api/routes/config.routes.js';
import systemRoutes from './api/routes/system.routes.js';
import { errorMiddleware, notFoundMiddleware } from './api/middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Deshabilitar HSTS si no hay HTTPS configurado
  hsts: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true' ? {
    maxAge: 31536000,
    includeSubDomains: true
  } : false,
  // Deshabilitar headers que requieren HTTPS
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  `http://localhost:${process.env.PORT || 3001}`,
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/config', configRoutes);
app.use('/api/system', systemRoutes);

// Servir archivos estáticos del frontend (solo en producción)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // SPA fallback: todas las rutas no-API devuelven index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

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
