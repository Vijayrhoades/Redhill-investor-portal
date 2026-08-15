import db from '../db.js';
import bcrypt from 'bcryptjs';

export const seedData = () => {
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('super_admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'admin@redhillinfra.com', hashedPassword, 'Redhill Admin', 'super_admin'
    );
  }

  const investor = db.prepare('SELECT * FROM users WHERE email = ?').get('investor@example.com');
  if (!investor) {
    const hashedPassword = bcrypt.hashSync('investor123', 10);
    const result = db.prepare('INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      'investor@example.com', hashedPassword, 'John Investor', 'investor', '+91 98765 43210', 'jo210'
    );
    const investorId = result.lastInsertRowid;

    // Seed Projects
    const projects = [
      {
        name: 'Redhill Signature Towers',
        location: 'Whitefield, Bangalore',
        value: '₹450 Cr',
        status: 'Construction',
        img: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2070',
        completion: 65,
        cctv: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4'
      },
      {
        name: 'Redhill Emerald Gardens',
        location: 'Sarjapur Road, Bangalore',
        value: '₹280 Cr',
        status: 'Approval',
        img: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=2070',
        completion: 25,
        cctv: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4'
      }
    ];

    projects.forEach(p => {
      const projResult = db.prepare('INSERT INTO projects (name, location, total_value, status, image_url, completion_percentage, cctv_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        p.name, p.location, p.value, p.status, p.img, p.completion, p.cctv
      );
      const projectId = projResult.lastInsertRowid;

      // Assign to investor with financial data
      const investmentData = projectId === projResult.lastInsertRowid && p.name.includes('Signature')
        ? { contribution: '₹2.5 Cr', investment_amount: 25000000, allotted_sqft: 1200, market_price: 15000, price_at_investment: 12000, investment_date: '2022-12-23' }
        : { contribution: '₹1.8 Cr', investment_amount: 18000000, allotted_sqft: 950, market_price: 12500, price_at_investment: 9800, investment_date: '2023-03-15' };
      db.prepare('INSERT INTO investor_projects (user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        investorId, projectId, investmentData.contribution, investmentData.investment_amount, investmentData.allotted_sqft, investmentData.market_price, investmentData.price_at_investment, investmentData.investment_date
      );

      // Seed Milestones
      const milestones = [
        { cat: 'documentation', name: 'Land Agreement', status: 'completed', pct: 100, doc: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
        { cat: 'documentation', name: 'RERA Filing', status: 'completed', pct: 100, doc: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
        { cat: 'approval', name: 'BBMP Approval', status: 'completed', pct: 100, doc: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
        { cat: 'approval', name: 'Fire NOC', status: 'in_progress', pct: 50 },
        { cat: 'construction', name: 'Excavation', status: 'completed', pct: 100, start: '2025-01-10', end: '2025-02-15' },
        { cat: 'construction', name: 'Foundation', status: 'in_progress', pct: 75, start: '2025-02-20', end: '2025-04-30' },
        { cat: 'construction', name: 'Slab Work', status: 'pending', pct: 0, start: '2025-05-01', end: '2025-12-31' }
      ];

      milestones.forEach(m => {
        db.prepare('INSERT INTO milestones (project_id, category, name, status, completion_percentage, start_date, expected_completion, doc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          projectId, m.cat, m.name, m.status, m.pct, m.start || null, m.end || null, m.doc || null
        );
      });

      // Seed Updates
      const updates = [
        { type: 'photo', url: 'https://images.unsplash.com/photo-1541975097477-da6028fa48f8?auto=format&fit=crop&q=80&w=2070', caption: 'Foundation work in full swing at Block A.', date: '2025-02-25' },
        { type: 'photo', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=2070', caption: 'Excavation completed for the basement levels.', date: '2025-02-10' },
        { type: 'photo', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=2070', caption: 'Steel reinforcement installation in progress.', date: '2025-01-20' },
        { type: 'photo', url: 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=2070', caption: 'Initial site survey and marking.', date: '2025-01-05' }
      ];

      updates.forEach(u => {
        db.prepare('INSERT INTO progress_updates (project_id, type, url, caption, date) VALUES (?, ?, ?, ?, ?)').run(
          projectId, u.type, u.url, u.caption, u.date
        );
      });

      // Seed Announcements
      db.prepare('INSERT INTO announcements (project_id, title, content) VALUES (?, ?, ?)').run(
        projectId, 'Project Milestone Achieved', 'We are pleased to announce that the excavation phase is now 100% complete ahead of schedule.'
      );
    });
    console.log('Seed data created successfully.');
  } else {
    try {
      db.prepare("UPDATE users SET login_id = 'jo210' WHERE email = 'investor@example.com' AND login_id IS NULL").run();
      db.prepare("UPDATE projects SET cctv_url = 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' WHERE cctv_url IS NULL").run();
      db.prepare("UPDATE investor_projects SET investment_amount = 25000000, allotted_sqft = 1200, market_price_per_sqft = 15000, price_at_investment = 12000, investment_date = '2022-12-23' WHERE (investment_amount = 0 OR investment_amount IS NULL) AND project_id = (SELECT MIN(id) FROM projects)").run();
      db.prepare("UPDATE investor_projects SET investment_amount = 18000000, allotted_sqft = 950, market_price_per_sqft = 12500, price_at_investment = 9800, investment_date = '2023-03-15' WHERE (price_at_investment = 0 OR price_at_investment IS NULL) AND project_id != (SELECT MIN(id) FROM projects)").run();
    } catch (e) {
      console.error('Failed to update existing data:', e);
    }
  }
};
