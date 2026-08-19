import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import investorRoutes from './investor.routes.js';
import queryRoutes from './query.routes.js';

const router = Router();

router.use('/api', authRoutes);
router.use('/api', adminRoutes);
router.use('/api', investorRoutes);
router.use('/api', queryRoutes);

export default router;
