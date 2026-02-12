import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);
router.put('/password', authMiddleware, AuthController.changePassword);

export default router;
