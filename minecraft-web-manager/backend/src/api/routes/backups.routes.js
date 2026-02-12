import express from 'express';
import BackupsController from '../controllers/backups.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', BackupsController.list);
router.post('/', roleMiddleware(['admin', 'moderator']), BackupsController.create);
router.delete('/:id', roleMiddleware(['admin']), BackupsController.delete);

export default router;
