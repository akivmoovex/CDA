import { Router } from 'express';
import adminRoutes from './admin/index.js';
import publicRoutes from './public/index.js';

const router = Router();

router.use('/', publicRoutes);
router.use('/admin', adminRoutes);

export default router;
