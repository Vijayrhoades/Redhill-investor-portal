import { Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

import { sendEmail } from '../services/email.service.js';

export const sendQuery = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { project_id, message, user_id } = req.body;
  const targetUserId = req.user.role === 'admin' ? user_id : req.user.id;

  const result = db.prepare('INSERT INTO queries (user_id, project_id, message, sender_role) VALUES (?, ?, ?, ?)').run(
    targetUserId, project_id, message, req.user.role
  );

  // Send email notifications
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(project_id) as any;
  if (project) {
    if (req.user.role === 'admin') {
      const investor = db.prepare('SELECT email, name FROM users WHERE id = ?').get(targetUserId) as any;
      if (investor) {
        sendEmail({
          to: investor.email,
          subject: `New Reply to Your Query: ${project.name}`,
          html: `<h2>Redhill Infra</h2><p>Hello ${investor.name},</p><p>An administrator has replied to your query regarding <strong>${project.name}</strong>.</p><p><strong>Reply:</strong> ${message}</p><p>Please log in to your portal to respond.</p>`
        }).catch(console.error);
      }
    } else {
      const admins = db.prepare('SELECT email FROM users WHERE role = ?').all('admin') as any[];
      if (admins.length > 0) {
        sendEmail({
          to: admins.map(a => a.email),
          subject: `New Investor Query: ${project.name}`,
          html: `<h2>Redhill Infra Admin Alert</h2><p>A new query has been posted by an investor for <strong>${project.name}</strong>.</p><p><strong>Message:</strong> ${message}</p><p>Please log in to the admin dashboard to reply.</p>`
        }).catch(console.error);
      }
    }
  }

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
