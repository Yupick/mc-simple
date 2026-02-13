import express from 'express';
import ServerController from '../controllers/server.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas públicas (todos los roles autenticados)
router.get('/status', ServerController.getStatus);
router.get('/info', ServerController.getInfo);
router.get('/logs', ServerController.getLogs);

// Rutas que requieren rol admin o moderator
router.post('/start', roleMiddleware(['admin', 'moderator']), ServerController.start);
router.post('/stop', roleMiddleware(['admin', 'moderator']), ServerController.stop);
router.post('/restart', roleMiddleware(['admin', 'moderator']), ServerController.restart);
router.post('/command', roleMiddleware(['admin', 'moderator']), ServerController.sendCommand);

export default router;
