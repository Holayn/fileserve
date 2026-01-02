import { Router } from 'express';
import shareRoutes from './share.js';

const router = Router();

router.get('/test', (req, res) => {
  res.sendStatus(200);
});

router.use('/api/share', shareRoutes);

export default router;
