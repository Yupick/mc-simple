import express from 'express';
import multer from 'multer';
import path from 'path';
import PluginsController from '../controllers/plugins.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Configuración de Multer para subir plugins
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const pluginsPath = path.join(process.env.SERVER_PATH || '../server', 'plugins');
    cb(null, pluginsPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.originalname.endsWith('.jar')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos .jar'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

router.use(authMiddleware);

router.get('/', PluginsController.list);
router.post('/upload', roleMiddleware(['admin', 'moderator']), upload.single('plugin'), PluginsController.upload);
router.get('/:name/config', PluginsController.getConfigFiles);
router.get('/:name/config/:file', PluginsController.getConfig);
router.put('/:name/config', roleMiddleware(['admin', 'moderator']), PluginsController.updateConfig);
router.put('/:name/toggle', roleMiddleware(['admin', 'moderator']), PluginsController.toggle);
router.delete('/:name', roleMiddleware(['admin']), PluginsController.delete);

export default router;
