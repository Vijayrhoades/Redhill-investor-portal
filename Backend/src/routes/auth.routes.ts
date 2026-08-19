import { Router } from 'express';
import { login, signup, logout, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
