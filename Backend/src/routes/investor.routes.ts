import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  getNewProjects,
  getPayments 
} from '../controllers/investor.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/investor/projects', authenticateToken, getProjects);
router.get('/investor/new-projects', authenticateToken, getNewProjects);
router.get('/investor/projects/:id', authenticateToken, getProjectById);
router.get('/investor/payments/:projectId', authenticateToken, getPayments);

export default router;
