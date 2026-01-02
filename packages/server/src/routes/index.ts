import { Router } from 'express';
import shareRoutes from './share.js';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    message: 'Hello there',
  });
});

router.get('/test', (req, res) => {
  res.sendStatus(200);
});

router.use('/api/share', shareRoutes);

export default router;
