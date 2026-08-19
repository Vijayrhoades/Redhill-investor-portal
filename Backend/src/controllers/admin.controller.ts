import { Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendEmail } from '../services/email.service.js';
import {
  sendMilestoneCompletedNotification,
  recalculateProjectProgress,
  getNotificationLogs,
  getProjectInvestors,
} from '../services/notification.service.js';

// Manage Admins
export const getAdmins = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ error: 'Super Admin required' });
  const admins = db.prepare("SELECT id, email, name, role FROM users WHERE role IN ('super_admin', 'site_manager', 'support_agent')").all();
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
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM payments WHERE user_id = ?').run(id);
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

export const updateProject = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, location, total_value, status, image_url, completion_percentage, cctv_url } = req.body;
  try {
    db.prepare(`
      UPDATE projects 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          total_value = COALESCE(?, total_value),
          status = COALESCE(?, status),
          image_url = COALESCE(?, image_url),
          completion_percentage = COALESCE(?, completion_percentage),
          cctv_url = COALESCE(?, cctv_url)
      WHERE id = ?
    `).run(name, location, total_value, status, image_url, completion_percentage, cctv_url, id);
    res.json({ message: 'Project updated successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteProject = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM notifications WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM progress_updates WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM announcements WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM milestones WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM payments WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM investor_projects WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM queries WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Project deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
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

// Manage Milestones & Project Investor Audience
export const getMilestones = (req: AuthRequest, res: Response) => {
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC').all(req.params.id);
  res.json(milestones);
};

export const getMilestonesWithInvestors = (req: AuthRequest, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY id ASC').all(projectId);
  const investors = getProjectInvestors(projectId);

  res.json({
    project,
    milestones,
    investors,
    totalInvestors: investors.length,
  });
};

export const createMilestone = async (req: AuthRequest, res: Response) => {
  const {
    project_id,
    category,
    name,
    status = 'pending',
    start_date,
    expected_completion,
    actual_completion,
    completion_percentage = 0,
    doc_url,
    target_days = 0,
    current_day = 0,
    notes = '',
  } = req.body;

  try {
    const isCompleted = status === 'completed' || completion_percentage >= 100;
    const finalStatus = isCompleted ? 'completed' : (completion_percentage > 0 ? 'in_progress' : status);
    const finalPct = isCompleted ? 100 : completion_percentage;
    const finalActual = isCompleted ? (actual_completion || new Date().toISOString().split('T')[0]) : actual_completion;

    const result = db.prepare(`
      INSERT INTO milestones (
        project_id, category, name, status, start_date, expected_completion, actual_completion, 
        completion_percentage, doc_url, target_days, current_day, notes, last_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      project_id, category, name, finalStatus, start_date || null, expected_completion || null,
      finalActual || null, finalPct, doc_url || null, target_days || 0, current_day || 0, notes || null
    );

    const milestoneId = Number(result.lastInsertRowid);
    let notificationResult = null;

    // If created as completed, immediately notify the project's investors!
    if (isCompleted) {
      try {
        notificationResult = await sendMilestoneCompletedNotification(milestoneId, {
          customNotes: notes,
          dayNumber: current_day,
          completionDate: finalActual,
        });
      } catch (notifyErr) {
        console.error('Error triggering milestone notification:', notifyErr);
      }
    } else {
      recalculateProjectProgress(project_id);
    }

    res.json({
      id: milestoneId,
      status: finalStatus,
      completion_percentage: finalPct,
      notificationResult,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateMilestone = async (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  const {
    name,
    category,
    status,
    actual_completion,
    completion_percentage,
    doc_url,
    target_days,
    current_day,
    notes,
    sendNotification,
  } = req.body;

  try {
    const prevMilestone: any = db.prepare('SELECT * FROM milestones WHERE id = ?').get(milestoneId);
    if (!prevMilestone) return res.status(404).json({ error: 'Milestone not found' });

    const isNowCompleted = status === 'completed' || completion_percentage >= 100;
    const wasCompleted = prevMilestone.status === 'completed';

    const newStatus = isNowCompleted ? 'completed' : (status || prevMilestone.status);
    const newPct = isNowCompleted ? 100 : (completion_percentage !== undefined ? completion_percentage : prevMilestone.completion_percentage);
    const newActual = isNowCompleted ? (actual_completion || prevMilestone.actual_completion || new Date().toISOString().split('T')[0]) : (actual_completion || prevMilestone.actual_completion);

    db.prepare(`
      UPDATE milestones 
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          status = ?,
          actual_completion = ?,
          completion_percentage = ?,
          doc_url = COALESCE(?, doc_url),
          target_days = COALESCE(?, target_days),
          current_day = COALESCE(?, current_day),
          notes = COALESCE(?, notes),
          last_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      category || null,
      newStatus,
      newActual || null,
      newPct,
      doc_url !== undefined ? doc_url : null,
      target_days !== undefined ? target_days : null,
      current_day !== undefined ? current_day : null,
      notes !== undefined ? notes : null,
      milestoneId
    );

    let notificationResult = null;

    // Automatically trigger notification if status is completed OR explicitly requested
    if (newStatus === 'completed' || isNowCompleted || sendNotification) {
      try {
        notificationResult = await sendMilestoneCompletedNotification(milestoneId, {
          customNotes: notes || prevMilestone.notes,
          dayNumber: current_day || prevMilestone.current_day,
          completionDate: newActual,
        });
      } catch (err) {
        console.error('Error dispatching automated milestone notification:', err);
      }
    } else {
      recalculateProjectProgress(prevMilestone.project_id);
    }

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      notificationResult,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteMilestone = (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  try {
    const milestone: any = db.prepare('SELECT project_id FROM milestones WHERE id = ?').get(milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    db.prepare('DELETE FROM notifications WHERE milestone_id = ?').run(milestoneId);
    db.prepare('DELETE FROM progress_updates WHERE milestone_id = ?').run(milestoneId);
    db.prepare('DELETE FROM milestones WHERE id = ?').run(milestoneId);

    recalculateProjectProgress(milestone.project_id);
    res.json({ message: 'Milestone deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Log Daily Construction Progress (e.g., Day 1 to Day 25, work updates, milestone completion)
export const logDailyProgress = async (req: AuthRequest, res: Response) => {
  const {
    milestone_id,
    project_id,
    day_number,
    work_notes,
    completion_percentage,
    is_completed,
    media_type,
    media_url,
    date = new Date().toISOString().split('T')[0],
  } = req.body;

  try {
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    let milestone: any = null;
    if (milestone_id) {
      milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(milestone_id);
    }

    // 1. Insert progress update entry
    if (media_url || work_notes) {
      db.prepare(`
        INSERT INTO progress_updates (project_id, type, url, caption, date, milestone_id, day_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        project_id,
        media_type || 'photo',
        media_url || 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2070',
        `Day ${day_number || ''}: ${work_notes || 'Daily site progress update'}`,
        date,
        milestone_id || null,
        day_number || null
      );
    }

    let notificationResult = null;

    // 2. If tied to a milestone, update its current day and progress
    if (milestone) {
      const willComplete = is_completed || completion_percentage >= 100;
      const targetPct = willComplete ? 100 : (completion_percentage !== undefined ? completion_percentage : milestone.completion_percentage);
      const targetStatus = willComplete ? 'completed' : (targetPct > 0 ? 'in_progress' : milestone.status);
      const actualCompletion = willComplete ? date : milestone.actual_completion;

      db.prepare(`
        UPDATE milestones
        SET current_day = COALESCE(?, current_day),
            completion_percentage = ?,
            status = ?,
            actual_completion = ?,
            notes = COALESCE(?, notes),
            last_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        day_number || null,
        targetPct,
        targetStatus,
        actualCompletion || null,
        work_notes || null,
        milestone.id
      );

      // 3. If completed, trigger automated email to ONLY the project's investors!
      if (willComplete && milestone.status !== 'completed') {
        try {
          notificationResult = await sendMilestoneCompletedNotification(milestone.id, {
            customNotes: work_notes,
            dayNumber: day_number,
            completionDate: date,
          });
        } catch (err) {
          console.error('Error dispatching automated milestone completion email:', err);
        }
      } else {
        recalculateProjectProgress(project_id);
      }
    } else {
      recalculateProjectProgress(project_id);
    }

    res.json({
      success: true,
      message: 'Daily construction progress logged successfully',
      notificationResult,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Manually trigger or preview milestone completion notification
export const manualNotifyMilestone = async (req: AuthRequest, res: Response) => {
  const milestoneId = parseInt(req.params.id, 10);
  const { customNotes, dayNumber } = req.body;

  try {
    const result = await sendMilestoneCompletedNotification(milestoneId, {
      customNotes,
      dayNumber,
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Get Notification Logs & Audit History
export const getNotifications = (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
    const milestoneId = req.query.milestoneId ? parseInt(req.query.milestoneId as string, 10) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

    const logs = getNotificationLogs({ projectId, milestoneId, userId });
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
    const activeProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status IN ("active", "in_progress", "Construction")').get() as any;
    const totalNotifications = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as any;

    res.json({
      totalFundsRaised: totalFunds?.total || 0,
      totalAllottedSqft: totalSqft?.total || 0,
      activeProjectsCount: activeProjects?.count || 0,
      totalNotificationsCount: totalNotifications?.count || 0,
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
