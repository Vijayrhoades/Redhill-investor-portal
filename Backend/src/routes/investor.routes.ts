import { Router } from 'express';
import { getProjects, getProjectById, getNewProjects } from '../controllers/investor.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/investor/projects', getProjects);
router.get('/investor/projects/:id', getProjectById);
router.get('/investor/new-projects', getNewProjects);

export default router;
