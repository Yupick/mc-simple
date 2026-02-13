import express from 'express';
import ConfigController from '../controllers/config.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Server Properties
router.get('/server-properties', ConfigController.getServerProperties);
router.put('/server-properties', roleMiddleware(['admin']), ConfigController.updateServerProperties);

// Whitelist
router.get('/whitelist', ConfigController.getWhitelist);
router.post('/whitelist', roleMiddleware(['admin', 'moderator']), ConfigController.addToWhitelist);
router.delete('/whitelist/:username', roleMiddleware(['admin', 'moderator']), ConfigController.removeFromWhitelist);

// Operators
router.get('/ops', ConfigController.getOps);
router.post('/ops', roleMiddleware(['admin']), ConfigController.addOp);
router.delete('/ops/:username', roleMiddleware(['admin']), ConfigController.removeOp);

export default router;
