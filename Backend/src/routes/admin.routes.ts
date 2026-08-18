import { Router } from 'express';
import {
  getAdmins,
  createAdmin,
  getInvestors,
  createInvestor,
  deleteInvestor,
  getProjects,
  createProject,
  updateCctv,
  assignInvestor,
  updateAssignment,
  addSubInvestment,
  getLedger,
  getAssignments,
  getMilestones,
  createMilestone,
  updateMilestone,
  createUpdate,
  uploadFile,
  getAnalytics,
  getPayments,
  addPayment
} from '../controllers/admin.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Admin Management (Super Admin only)
router.get('/admin/users', authenticateToken, isAdmin, getAdmins);
router.post('/admin/users', authenticateToken, isAdmin, createAdmin);

// Analytics
router.get('/admin/analytics', authenticateToken, isAdmin, getAnalytics);

// Investor Management
router.get('/admin/investors', authenticateToken, isAdmin, getInvestors);
router.post('/admin/investors', authenticateToken, isAdmin, createInvestor);
router.delete('/admin/investors/:id', authenticateToken, isAdmin, deleteInvestor);

// Project Management
router.get('/admin/projects', authenticateToken, isAdmin, getProjects);
router.post('/admin/projects', authenticateToken, isAdmin, createProject);
router.patch('/admin/projects/:id/cctv', authenticateToken, isAdmin, updateCctv);

// Assignment & Financial Management
router.post('/admin/assign', authenticateToken, isAdmin, assignInvestor);
router.patch('/admin/investor-project/:userId/:projectId', authenticateToken, isAdmin, updateAssignment);
router.get('/admin/investor-projects', authenticateToken, isAdmin, getAssignments);

// Investment Ledger & Sub-investments
router.get('/admin/ledger', authenticateToken, isAdmin, getLedger);
router.post('/admin/ledger/sub-investment', authenticateToken, isAdmin, addSubInvestment);

// Milestones
router.get('/admin/projects/:id/milestones', authenticateToken, isAdmin, getMilestones);
router.post('/admin/milestones', authenticateToken, isAdmin, createMilestone);
router.patch('/admin/milestones/:id', authenticateToken, isAdmin, updateMilestone);

// Updates
router.post('/admin/updates', authenticateToken, isAdmin, createUpdate);

// Uploads
router.post('/admin/upload', authenticateToken, isAdmin, upload.single('file'), uploadFile);

// Payments
router.get('/admin/payments/:projectId/:userId', authenticateToken, isAdmin, getPayments);
router.post('/admin/payments', authenticateToken, isAdmin, addPayment);

export default router;
