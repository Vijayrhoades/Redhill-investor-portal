import { Router } from 'express';
import {
  getInvestors,
  createInvestor,
  deleteInvestor,
  getProjects,
  createProject,
  updateCctv,
  assignInvestor,
  updateAssignment,
  getAssignments,
  getMilestones,
  createMilestone,
  updateMilestone,
  createUpdate,
  uploadFile
} from '../controllers/admin.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Apply auth & admin middlewares to all admin routes
router.use(authenticateToken, isAdmin);

// Investor Management
router.get('/admin/investors', getInvestors);
router.post('/admin/investors', createInvestor);
router.delete('/admin/investors/:id', deleteInvestor);

// Project Management
router.get('/admin/projects', getProjects);
router.post('/admin/projects', createProject);
router.patch('/admin/projects/:id/cctv', updateCctv);

// Assignment & Financial Management
router.post('/admin/assign', assignInvestor);
router.patch('/admin/investor-project/:userId/:projectId', updateAssignment);
router.get('/admin/investor-projects', getAssignments);

// Milestones
router.get('/admin/projects/:id/milestones', getMilestones);
router.post('/admin/milestones', createMilestone);
router.patch('/admin/milestones/:id', updateMilestone);

// Updates & File Uploads
router.post('/admin/updates', createUpdate);
router.post('/upload', upload.single('file'), uploadFile);

export default router;
