import express from 'express';
import WorldsController from '../controllers/worlds.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (todos los roles)
router.get('/', WorldsController.list);
router.get('/active', WorldsController.getActive);
router.get('/:id', WorldsController.getById);
router.get('/:id/properties', WorldsController.getProperties);

// Rutas de escritura (admin y moderator)
router.post('/', roleMiddleware(['admin', 'moderator']), WorldsController.create);
router.put('/:id', roleMiddleware(['admin', 'moderator']), WorldsController.update);
router.post('/:id/activate', roleMiddleware(['admin', 'moderator']), WorldsController.activate);
router.put('/:id/properties', roleMiddleware(['admin', 'moderator']), WorldsController.updateProperties);

// Rutas de eliminación (solo admin)
router.delete('/:id', roleMiddleware(['admin']), WorldsController.delete);

export default router;
