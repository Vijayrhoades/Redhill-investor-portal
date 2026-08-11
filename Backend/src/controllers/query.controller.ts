import { Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const sendQuery = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { project_id, message, user_id } = req.body;
  const targetUserId = req.user.role === 'admin' ? user_id : req.user.id;

  const result = db.prepare('INSERT INTO queries (user_id, project_id, message, sender_role) VALUES (?, ?, ?, ?)').run(
    targetUserId, project_id, message, req.user.role
  );
  res.json({ id: result.lastInsertRowid, created_at: new Date().toISOString() });
};

export const getInvestorQueries = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.user.id, req.params.projectId);
  res.json(queries);
};

export const getAdminQueryThreads = (_req: AuthRequest, res: Response) => {
  const threads = db.prepare(`
    SELECT q.user_id, q.project_id, u.name as userName, p.name as projectName, MAX(q.created_at) as lastMessage,
      (SELECT q2.sender_role FROM queries q2 WHERE q2.user_id = q.user_id AND q2.project_id = q.project_id ORDER BY q2.created_at DESC LIMIT 1) as last_sender_role
    FROM queries q
    JOIN users u ON q.user_id = u.id
    JOIN projects p ON q.project_id = p.id
    GROUP BY q.user_id, q.project_id
    ORDER BY lastMessage DESC
  `).all();
  res.json(threads);
};

export const getAdminQueryThread = (req: AuthRequest, res: Response) => {
  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.params.userId, req.params.projectId);
  res.json(queries);
};
