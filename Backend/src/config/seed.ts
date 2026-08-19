import db from '../db.js';
import bcrypt from 'bcryptjs';

export const seedData = () => {
  // 1. Seed Super Admin
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('super_admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'admin@redhillinfra.com', hashedPassword, 'Redhill Admin', 'super_admin'
    );
  }

  // 2. Helper to upsert investor
  const ensureInvestor = (name: string, email: string, phone: string, login_id: string) => {
    let inv: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!inv) {
      const hashedPassword = bcrypt.hashSync('investor123', 10);
      const res = db.prepare('INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)').run(
        email, hashedPassword, name, 'investor', phone, login_id
      );
      inv = { id: res.lastInsertRowid, name, email, phone, login_id };
    }
    return inv;
  };

  const inv1 = ensureInvestor('John Investor', 'investor@example.com', '+91 98765 43210', 'jo210');
  const inv2 = ensureInvestor('Sarah Jenkins', 'sarah.investor@example.com', '+91 98765 11223', 'sa223');
  const inv3 = ensureInvestor('David Kumar', 'david.investor@example.com', '+91 98765 33445', 'da445');
  const inv4 = ensureInvestor('Michael Chang', 'michael.investor@example.com', '+91 98765 55667', 'mi667');
  const invVinay = ensureInvestor('Vinay (You)', 'vinaykl990280487@gmail.com', '+91 99028 04870', 'vi870');

  // 3. Ensure Projects exist
  let projectA: any = db.prepare('SELECT * FROM projects WHERE name LIKE ?').get('%Signature Towers%');
  if (!projectA) {
    const res = db.prepare('INSERT INTO projects (name, location, total_value, status, image_url, completion_percentage, cctv_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'Redhill Signature Towers (Project A)',
      'Whitefield, Bangalore',
      '₹450 Cr',
      'Construction',
      'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2070',
      60,
      'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4'
    );
    projectA = { id: res.lastInsertRowid, name: 'Redhill Signature Towers (Project A)' };
  }

  let projectB: any = db.prepare('SELECT * FROM projects WHERE name LIKE ?').get('%Emerald Gardens%');
  if (!projectB) {
    const res = db.prepare('INSERT INTO projects (name, location, total_value, status, image_url, completion_percentage, cctv_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'Redhill Emerald Gardens (Project B)',
      'Sarjapur Road, Bangalore',
      '₹280 Cr',
      'Approval',
      'https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=2070',
      25,
      'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4'
    );
    projectB = { id: res.lastInsertRowid, name: 'Redhill Emerald Gardens (Project B)' };
  }

  // 4. Assign Investors to Projects:
  // Project A has Investor 1, Investor 2, Investor 3, Vinay
  // Project B has Investor 1, Investor 4
  const assignIfNotExists = (userId: number, projectId: number, contribution: string, amount: number, sqft: number, price: number) => {
    const existing = db.prepare('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?').get(userId, projectId);
    if (!existing) {
      db.prepare(`
        INSERT INTO investor_projects (
          user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, projectId, contribution, amount, sqft, price, price * 0.8, '2023-01-15');
    }
  };

  if (projectA) {
    assignIfNotExists(inv1.id, projectA.id, '₹2.5 Cr', 25000000, 1200, 15000);
    assignIfNotExists(inv2.id, projectA.id, '₹1.5 Cr', 15000000, 800, 15000);
    assignIfNotExists(inv3.id, projectA.id, '₹3.0 Cr', 30000000, 1500, 15000);
    assignIfNotExists(invVinay.id, projectA.id, '₹2.0 Cr', 20000000, 1000, 15000);
  }

  if (projectB) {
    assignIfNotExists(inv1.id, projectB.id, '₹1.8 Cr', 18000000, 950, 12500);
    assignIfNotExists(inv4.id, projectB.id, '₹2.0 Cr', 20000000, 1100, 12500);
  }

  // 5. Seed / Ensure Milestones for Project A
  if (projectA) {
    const existingMilestones = db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(projectA.id) as any[];
    if (existingMilestones.length === 0) {
      const milestones = [
        { cat: 'documentation', name: 'Land Agreement & Legal Vetting', status: 'completed', pct: 100, targetDays: 15, currentDay: 15, notes: 'Clear title deed executed and registered.' },
        { cat: 'approval', name: 'BBMP Plan Sanction & Approvals', status: 'completed', pct: 100, targetDays: 30, currentDay: 30, notes: 'Municipal building sanction received.' },
        { cat: 'approval', name: 'Fire NOC & Environmental Clearance', status: 'in_progress', pct: 60, targetDays: 20, currentDay: 12, notes: 'Inspection scheduled for next week.' },
        { cat: 'construction', name: 'Excavation & Foundation', status: 'completed', pct: 100, targetDays: 45, currentDay: 45, notes: 'Basement foundation and retaining walls finished.' },
        { cat: 'construction', name: 'Pillar Work & Structural Columns (25-Day Cycle)', status: 'in_progress', pct: 75, targetDays: 25, currentDay: 18, notes: 'Pillars for Block A and Block B in full progress.' },
        { cat: 'construction', name: 'First Floor Slab Casting', status: 'pending', pct: 0, targetDays: 20, currentDay: 0, notes: 'Scheduled upon pillar work completion.' }
      ];

      milestones.forEach(m => {
        db.prepare(`
          INSERT INTO milestones (
            project_id, category, name, status, completion_percentage, target_days, current_day, notes, last_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(projectA.id, m.cat, m.name, m.status, m.pct, m.targetDays, m.currentDay, m.notes);
      });
    }
  }

  console.log('Seed data initialized/verified with multi-investor mapping.');
};
