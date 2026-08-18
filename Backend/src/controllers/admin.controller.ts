import { Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendEmail } from '../services/email.service.js';

// Manage Admins
export const getAdmins = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Super Admin required' });
  const admins = db.prepare('SELECT id, email, name, role FROM users WHERE role IN ("super_admin", "site_manager", "support_agent")').all();
  res.json(admins);
};

export const createAdmin = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Super Admin required' });
  const { email, password, name, role } = req.body;
  if (!['super_admin', 'site_manager', 'support_agent'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(email, hashedPassword, name, role);
    res.json({ id: result.lastInsertRowid, email, name, role });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

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

    // Automatically record initial assignment entry in investment_ledger
    const txDate = investment_date || new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO investment_ledger (
        user_id, project_id, transaction_type, investment_amount, allotted_sqft,
        price_at_investment, market_price_per_sqft, contribution, note, transaction_date
      ) VALUES (?, ?, 'initial_assignment', ?, ?, ?, ?, ?, 'Initial project assignment', ?)
    `).run(
      user_id, project_id, investment_amount || 0, allotted_sqft || 0,
      price_at_investment || 0, market_price_per_sqft || 0, contribution || '', txDate
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

// Add Sub-Investment / Upgrade Investment
export const addSubInvestment = (req: AuthRequest, res: Response) => {
  const { user_id, project_id, investment_amount, allotted_sqft, price_at_investment, market_price_per_sqft, contribution, note, transaction_date } = req.body;
  
  try {
    const existing = db.prepare('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?').get(user_id, project_id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Investor is not assigned to this project' });
    }

    const addedAmt = parseFloat(investment_amount) || 0;
    const addedSqft = parseFloat(allotted_sqft) || 0;
    const priceAtInv = parseFloat(price_at_investment) || existing.price_at_investment || 0;
    const marketPrice = parseFloat(market_price_per_sqft) || existing.market_price_per_sqft || 0;
    const txDate = transaction_date || new Date().toISOString().split('T')[0];
    const txNote = note || 'Sub-investment addition / upgrade';

    const newTotalAmt = (existing.investment_amount || 0) + addedAmt;
    const newTotalSqft = (existing.allotted_sqft || 0) + addedSqft;

    const formatCrLakh = (val: number) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
      return `₹${val.toLocaleString('en-IN')}`;
    };

    const updatedContribution = contribution || formatCrLakh(newTotalAmt);

    // Update main assignment record with cumulative totals
    db.prepare(`
      UPDATE investor_projects
      SET investment_amount = ?,
          allotted_sqft = ?,
          price_at_investment = ?,
          market_price_per_sqft = ?,
          contribution = ?
      WHERE user_id = ? AND project_id = ?
    `).run(newTotalAmt, newTotalSqft, priceAtInv, marketPrice, updatedContribution, user_id, project_id);

    // Insert into ledger audit log
    const ledgerResult = db.prepare(`
      INSERT INTO investment_ledger (
        user_id, project_id, transaction_type, investment_amount, allotted_sqft,
        price_at_investment, market_price_per_sqft, contribution, note, transaction_date
      ) VALUES (?, ?, 'sub_investment', ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, project_id, addedAmt, addedSqft, priceAtInv, marketPrice, updatedContribution, txNote, txDate);

    res.json({
      message: 'Sub-investment added and logged to ledger successfully',
      ledger_id: ledgerResult.lastInsertRowid,
      new_total_amount: newTotalAmt,
      new_total_sqft: newTotalSqft
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Fetch Investment Ledger
export const getLedger = (req: AuthRequest, res: Response) => {
  try {
    const { userId, projectId, search } = req.query;
    let queryStr = `
      SELECT il.*, u.name as investor_name, u.email as investor_email, u.login_id as investor_login_id, p.name as project_name
      FROM investment_ledger il
      JOIN users u ON il.user_id = u.id
      JOIN projects p ON il.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      queryStr += ` AND il.user_id = ?`;
      params.push(userId);
    }
    if (projectId) {
      queryStr += ` AND il.project_id = ?`;
      params.push(projectId);
    }
    if (search) {
      queryStr += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.login_id LIKE ? OR p.name LIKE ? OR il.note LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    queryStr += ` ORDER BY il.created_at DESC, il.id DESC`;

    const ledgerEntries = db.prepare(queryStr).all(...params);
    res.json(ledgerEntries);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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
  
  if (status === 'completed') {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(project_id) as any;
    const investors = db.prepare(`SELECT u.email, u.name FROM users u JOIN investor_projects ip ON ip.user_id = u.id WHERE ip.project_id = ?`).all(project_id) as any[];
    
    if (project && investors.length > 0) {
      const emails = investors.map(i => i.email);
      sendEmail({
        to: emails,
        subject: `Milestone Completed: ${project.name}`,
        html: `<h2>Redhill Infra Updates</h2><p>Good news! The milestone <strong>${name}</strong> for ${project.name} has been marked as completed.</p>`
      }).catch(console.error);
    }
  }

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

  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(project_id) as any;
  const investors = db.prepare(`SELECT u.email, u.name FROM users u JOIN investor_projects ip ON ip.user_id = u.id WHERE ip.project_id = ?`).all(project_id) as any[];
  
  if (project && investors.length > 0) {
    const emails = investors.map(i => i.email);
    sendEmail({
      to: emails,
      subject: `New Media Update: ${project.name}`,
      html: `<h2>Redhill Infra Updates</h2><p>A new ${type} update has been added to ${project.name}.</p><p><strong>Caption:</strong> ${caption}</p><p>Log in to your portal to view it.</p>`
    }).catch(console.error);
  }

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

// Analytics
export const getAnalytics = (_req: AuthRequest, res: Response) => {
  try {
    const totalFunds = db.prepare('SELECT SUM(investment_amount) as total FROM investor_projects').get() as any;
    const totalSqft = db.prepare('SELECT SUM(allotted_sqft) as total FROM investor_projects').get() as any;
    const activeProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status IN ("active", "in_progress")').get() as any;

    res.json({
      totalFundsRaised: totalFunds?.total || 0,
      totalAllottedSqft: totalSqft?.total || 0,
      activeProjectsCount: activeProjects?.count || 0
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// Payments
export const getPayments = (req: AuthRequest, res: Response) => {
  const { projectId, userId } = req.params;
  const payments = db.prepare('SELECT * FROM payments WHERE project_id = ? AND user_id = ? ORDER BY date DESC').all(projectId, userId);
  res.json(payments);
};

export const addPayment = (req: AuthRequest, res: Response) => {
  const { project_id, user_id, amount, date, type, status, description, file_url } = req.body;
  const result = db.prepare('INSERT INTO payments (project_id, user_id, amount, date, type, status, description, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    project_id, user_id, amount, date, type, status, description, file_url
  );
  res.json({ id: result.lastInsertRowid });
};
