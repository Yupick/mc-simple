import express from 'express';
import PluginsController from '../controllers/plugins.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', PluginsController.list);
router.get('/:name/config', PluginsController.getConfigFiles);
router.put('/:name/toggle', roleMiddleware(['admin', 'moderator']), PluginsController.toggle);
router.delete('/:name', roleMiddleware(['admin']), PluginsController.delete);

export default router;
