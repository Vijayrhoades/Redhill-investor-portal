import { Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// Manage Investors
export const getInvestors = (_req: AuthRequest, res: Response) => {
  const investors = db.prepare('SELECT id, email, name, phone, login_id FROM users WHERE role = ?').all('investor');
  res.json(investors);
};

export const createInvestor = (req: AuthRequest, res: Response) => {
  const { email, password, name, phone } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const login_id = (name.substring(0, 2).toLowerCase() + phone.replace(/\D/g, '').slice(-3));

  try {
    const result = db.prepare('INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      email, hashedPassword, name, 'investor', phone, login_id
    );
    res.json({ id: result.lastInsertRowid, email, name, role: 'investor', login_id, phone });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteInvestor = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM investor_projects WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM queries WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(id, 'investor');
    res.json({ message: 'Investor deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Manage Projects
export const getProjects = (_req: AuthRequest, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  res.json(projects);
};

export const createProject = (req: AuthRequest, res: Response) => {
  const { name, location, total_value, status, image_url, cctv_url } = req.body;
  const result = db.prepare('INSERT INTO projects (name, location, total_value, status, image_url, cctv_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    name, location, total_value, status, image_url, cctv_url
  );
  res.json({ id: result.lastInsertRowid, name, location });
};

export const updateCctv = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { cctv_url } = req.body;
  db.prepare('UPDATE projects SET cctv_url = ? WHERE id = ?').run(cctv_url, id);
  res.json({ success: true });
};

// Assign Investor to Project
export const assignInvestor = (req: AuthRequest, res: Response) => {
  const { user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date } = req.body;
  try {
    db.prepare('INSERT INTO investor_projects (user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      user_id, project_id, contribution, investment_amount || 0, allotted_sqft || 0, market_price_per_sqft || 0, price_at_investment || 0, investment_date || null
    );
    res.json({ message: 'Assigned successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateAssignment = (req: AuthRequest, res: Response) => {
  const { userId, projectId } = req.params;
  const { investment_amount, allotted_sqft, market_price_per_sqft, contribution, price_at_investment, investment_date } = req.body;
  try {
    db.prepare('UPDATE investor_projects SET investment_amount = ?, allotted_sqft = ?, market_price_per_sqft = ?, contribution = ?, price_at_investment = ?, investment_date = ? WHERE user_id = ? AND project_id = ?').run(
      investment_amount, allotted_sqft, market_price_per_sqft, contribution, price_at_investment || 0, investment_date || null, userId, projectId
    );
    res.json({ message: 'Updated successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getAssignments = (_req: AuthRequest, res: Response) => {
  const assignments = db.prepare(`
    SELECT ip.*, u.name as investor_name, u.email as investor_email, p.name as project_name
    FROM investor_projects ip
    JOIN users u ON ip.user_id = u.id
    JOIN projects p ON ip.project_id = p.id
    ORDER BY u.name, p.name
  `).all();
  res.json(assignments);
};

// Manage Milestones
export const getMilestones = (req: AuthRequest, res: Response) => {
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(req.params.id);
  res.json(milestones);
};

export const createMilestone = (req: AuthRequest, res: Response) => {
  const { project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url } = req.body;
  const result = db.prepare('INSERT INTO milestones (project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url
  );
  res.json({ id: result.lastInsertRowid });
};

export const updateMilestone = (req: AuthRequest, res: Response) => {
  const { status, actual_completion, completion_percentage } = req.body;
  db.prepare('UPDATE milestones SET status = ?, actual_completion = ?, completion_percentage = ? WHERE id = ?').run(
    status, actual_completion, completion_percentage, req.params.id
  );
  res.json({ message: 'Updated' });
};

// Manage Updates (Photos/Videos)
export const createUpdate = (req: AuthRequest, res: Response) => {
  const { project_id, type, url, caption, date, milestone_id } = req.body;
  const result = db.prepare('INSERT INTO progress_updates (project_id, type, url, caption, date, milestone_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    project_id, type, url, caption, date, milestone_id
  );
  res.json({ id: result.lastInsertRowid });
};

// File Upload
export const uploadFile = (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname, mimetype: req.file.mimetype });
};
