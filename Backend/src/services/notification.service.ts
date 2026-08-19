import db from '../db.js';
import { sendEmail, generateMilestoneCompletedHtml } from './email.service.js';

export interface ProjectInvestor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  contribution?: string;
  allotted_sqft?: number;
}

export interface MilestoneNotificationResult {
  success: boolean;
  projectId: number;
  projectName: string;
  milestoneId: number;
  milestoneName: string;
  totalInvestors: number;
  notifiedRecipients: { id: number; name: string; email: string }[];
  announcementCreated: boolean;
  message?: string;
}

/**
 * Recalculate and update the overall project completion percentage based on its milestones
 */
export const recalculateProjectProgress = (projectId: number): number => {
  try {
    const milestones = db.prepare('SELECT completion_percentage FROM milestones WHERE project_id = ?').all(projectId) as { completion_percentage: number }[];
    if (!milestones || milestones.length === 0) return 0;

    const totalPct = milestones.reduce((sum, m) => sum + (m.completion_percentage || 0), 0);
    const avgPct = Math.round(totalPct / milestones.length);

    db.prepare('UPDATE projects SET completion_percentage = ? WHERE id = ?').run(avgPct, projectId);
    return avgPct;
  } catch (err) {
    console.error('Error recalculating project progress:', err);
    return 0;
  }
};

/**
 * Fetch all investors assigned to a specific project
 */
export const getProjectInvestors = (projectId: number): ProjectInvestor[] => {
  try {
    const investors = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, ip.contribution, ip.allotted_sqft
      FROM users u
      JOIN investor_projects ip ON ip.user_id = u.id
      WHERE ip.project_id = ? AND u.role = 'investor'
    `).all(projectId) as ProjectInvestor[];

    return investors;
  } catch (err) {
    console.error(`Error querying investors for project ${projectId}:`, err);
    return [];
  }
};

/**
 * Core notification trigger: Dispatches milestone completion emails ONLY to investors of the specified project.
 */
export const sendMilestoneCompletedNotification = async (
  milestoneId: number,
  options?: {
    customNotes?: string;
    dayNumber?: number;
    completionDate?: string;
  }
): Promise<MilestoneNotificationResult> => {
  const milestone: any = db.prepare(`
    SELECT m.*, p.name as project_name, p.location as project_location, p.image_url as project_image_url
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE m.id = ?
  `).get(milestoneId);

  if (!milestone) {
    throw new Error(`Milestone with ID ${milestoneId} not found`);
  }

  const projectId = milestone.project_id;
  const projectName = milestone.project_name;
  const projectLocation = milestone.project_location;
  const projectImageUrl = milestone.project_image_url;
  const milestoneName = milestone.name;
  const milestoneCategory = milestone.category;
  const completionDate = options?.completionDate || milestone.actual_completion || new Date().toISOString().split('T')[0];
  const dayNumber = options?.dayNumber || milestone.current_day || undefined;
  const targetDays = milestone.target_days || undefined;
  const notes = options?.customNotes || milestone.notes || undefined;

  // 1. Query ONLY the investors invested in this project
  const investors = getProjectInvestors(projectId);

  const notifiedRecipients: { id: number; name: string; email: string }[] = [];

  // 2. Dispatch personalized branded emails to each investor
  for (const investor of investors) {
    const subject = `🎉 Milestone Completed: ${milestoneName} — ${projectName}`;
    const html = generateMilestoneCompletedHtml({
      investorName: investor.name,
      projectName,
      projectLocation,
      projectImageUrl,
      projectId,
      milestoneName,
      milestoneCategory,
      completionDate,
      dayNumber,
      targetDays,
      notes,
    });

    const isSent = await sendEmail({
      to: investor.email,
      subject,
      html,
    });

    // 3. Log notification in database for audit and transparency
    try {
      db.prepare(`
        INSERT INTO notifications (
          project_id, milestone_id, user_id, recipient_email, recipient_name, subject, type, content_html, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        milestoneId,
        investor.id,
        investor.email,
        investor.name,
        subject,
        'milestone_completed',
        html,
        isSent ? 'sent' : 'failed'
      );

      notifiedRecipients.push({
        id: investor.id,
        name: investor.name,
        email: investor.email,
      });
    } catch (logErr) {
      console.error(`Error logging notification for investor ${investor.id}:`, logErr);
    }
  }

  // 4. Create an announcement on the project feed so investors see it in portal
  let announcementCreated = false;
  try {
    const announcementTitle = `Milestone Completed: ${milestoneName}`;
    const announcementContent = notes
      ? `We have completed the ${milestoneName} (${milestoneCategory}) milestone for ${projectName}. Notes: ${notes}`
      : `We are pleased to announce that the ${milestoneName} (${milestoneCategory}) milestone for ${projectName} has been successfully completed.`;

    db.prepare(`
      INSERT INTO announcements (project_id, title, content)
      VALUES (?, ?, ?)
    `).run(projectId, announcementTitle, announcementContent);
    announcementCreated = true;
  } catch (annErr) {
    console.error('Error creating announcement:', annErr);
  }

  // 5. Recalculate project progress
  recalculateProjectProgress(projectId);

  return {
    success: true,
    projectId,
    projectName,
    milestoneId,
    milestoneName,
    totalInvestors: investors.length,
    notifiedRecipients,
    announcementCreated,
    message: `Automated email successfully dispatched to ${notifiedRecipients.length} investor(s) of ${projectName}.`,
  };
};

/**
 * Retrieve notification logs with optional project/milestone filters
 */
export const getNotificationLogs = (filters?: { projectId?: number; milestoneId?: number; userId?: number }) => {
  let query = `
    SELECT 
      n.*,
      p.name as project_name,
      p.location as project_location,
      m.name as milestone_name,
      m.category as milestone_category,
      u.name as user_name
    FROM notifications n
    LEFT JOIN projects p ON n.project_id = p.id
    LEFT JOIN milestones m ON n.milestone_id = m.id
    LEFT JOIN users u ON n.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.projectId) {
    query += ` AND n.project_id = ?`;
    params.push(filters.projectId);
  }

  if (filters?.milestoneId) {
    query += ` AND n.milestone_id = ?`;
    params.push(filters.milestoneId);
  }

  if (filters?.userId) {
    query += ` AND n.user_id = ?`;
    params.push(filters.userId);
  }

  query += ` ORDER BY n.created_at DESC`;

  return db.prepare(query).all(...params);
};
