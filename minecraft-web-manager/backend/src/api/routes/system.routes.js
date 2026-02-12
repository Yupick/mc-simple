import express from 'express';
import SystemController from '../controllers/system.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// System info
router.get('/info', SystemController.getSystemInfo);

// Logs
router.get('/logs', SystemController.getLogs);

export default router;
