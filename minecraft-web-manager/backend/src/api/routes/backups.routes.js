import express from 'express';
import BackupsController from '../controllers/backups.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', BackupsController.list);
router.post('/', roleMiddleware(['admin', 'moderator']), BackupsController.create);
router.post('/:id/restore', roleMiddleware(['admin']), BackupsController.restore);
router.get('/:id/download', BackupsController.download);
router.delete('/:id', roleMiddleware(['admin']), BackupsController.delete);

// Backups programados
router.get('/scheduled', BackupsController.listScheduled);
router.post('/scheduled', roleMiddleware(['admin']), BackupsController.createScheduled);
router.patch('/scheduled/:id', roleMiddleware(['admin']), BackupsController.updateScheduled);
router.delete('/scheduled/:id', roleMiddleware(['admin']), BackupsController.deleteScheduled);

export default router;
