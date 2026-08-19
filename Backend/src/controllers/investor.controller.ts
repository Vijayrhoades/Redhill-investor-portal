import { Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getNotificationLogs } from '../services/notification.service.js';

export const getProjects = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const projects = db.prepare(`
    SELECT p.*, ip.contribution, ip.investment_amount, ip.allotted_sqft, ip.market_price_per_sqft, ip.price_at_investment, ip.investment_date 
    FROM projects p 
    JOIN investor_projects ip ON p.id = ip.project_id 
    WHERE ip.user_id = ?
  `).all(req.user.id);
  res.json(projects);
};

export const getProjectById = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const access: any = db.prepare('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?').get(req.user.id, req.params.id);
  if (!access && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const project: any = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

  if (access && project) {
    project.contribution = access.contribution;
    project.investment_amount = access.investment_amount;
    project.allotted_sqft = access.allotted_sqft;
    project.market_price_per_sqft = access.market_price_per_sqft;
    project.price_at_investment = access.price_at_investment;
    project.investment_date = access.investment_date;
  }

  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC').all(req.params.id);
  const updates = db.prepare('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY date DESC, id DESC').all(req.params.id);
  const announcements = db.prepare('SELECT * FROM announcements WHERE project_id = ? ORDER BY date DESC, id DESC').all(req.params.id);
  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.user.id, req.params.id);

  res.json({ project, milestones, updates, announcements, queries });
};

export const getNewProjects = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const newProjects = db.prepare(`
      SELECT p.* FROM projects p 
      WHERE p.id NOT IN (
        SELECT ip.project_id FROM investor_projects ip WHERE ip.user_id = ?
      )
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(newProjects);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPayments = (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const payments = db.prepare('SELECT * FROM payments WHERE project_id = ? AND user_id = ? ORDER BY date DESC').all(projectId, userId);
    res.json(payments);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getNotifications = (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = getNotificationLogs({ userId });
    res.json(notifications);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
