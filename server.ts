import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'redhill-infra-secret-key';

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// --- FILE UPLOADS ---
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Seed Data
const seedData = () => {
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'admin@redhillinfra.com', hashedPassword, 'Redhill Admin', 'admin'
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
    // Ensure existing investor has login_id and financial data
    try {
      db.prepare("UPDATE users SET login_id = 'jo210' WHERE email = 'investor@example.com' AND login_id IS NULL").run();
      db.prepare("UPDATE projects SET cctv_url = 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' WHERE cctv_url IS NULL").run();
      // Backfill financial data for existing investor_projects
      db.prepare("UPDATE investor_projects SET investment_amount = 25000000, allotted_sqft = 1200, market_price_per_sqft = 15000, price_at_investment = 12000, investment_date = '2022-12-23' WHERE (investment_amount = 0 OR investment_amount IS NULL) AND project_id = (SELECT MIN(id) FROM projects)").run();
      db.prepare("UPDATE investor_projects SET investment_amount = 18000000, allotted_sqft = 950, market_price_per_sqft = 12500, price_at_investment = 9800, investment_date = '2023-03-15' WHERE (price_at_investment = 0 OR price_at_investment IS NULL) AND project_id != (SELECT MIN(id) FROM projects)").run();
    } catch (e) {
      console.error('Failed to update existing data:', e);
    }
  }
};
seedData();

// Middleware: Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Allow login by email OR login_id
  const user: any = db.prepare('SELECT * FROM users WHERE email = ? OR login_id = ?').get(email, email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

app.post('/api/signup', (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Check if user already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const phoneVal = phone || '';
  const login_id = (name.substring(0, 2).toLowerCase() + phoneVal.replace(/\D/g, '').slice(-3) + Math.floor(Math.random() * 100));

  try {
    const result = db.prepare('INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      email, hashedPassword, name, 'investor', phoneVal, login_id
    );
    
    const user = { id: result.lastInsertRowid, email, name, role: 'investor' };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ message: 'Logged out' });
});

app.get('/api/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// --- ADMIN ROUTES ---

// Manage Investors
app.get('/api/admin/investors', authenticateToken, isAdmin, (req, res) => {
  const investors = db.prepare('SELECT id, email, name, phone, login_id FROM users WHERE role = ?').all('investor');
  res.json(investors);
});

app.post('/api/admin/investors', authenticateToken, isAdmin, (req, res) => {
  const { email, password, name, phone } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate login_id: first 2 of name + last 3 of phone
  const login_id = (name.substring(0, 2).toLowerCase() + phone.replace(/\D/g, '').slice(-3));

  try {
    const result = db.prepare('INSERT INTO users (email, password, name, role, phone, login_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      email, hashedPassword, name, 'investor', phone, login_id
    );
    res.json({ id: result.lastInsertRowid, email, name, role: 'investor', login_id, phone });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Delete Investor
app.delete('/api/admin/investors/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM investor_projects WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM queries WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(id, 'investor');
    res.json({ message: 'Investor deleted successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Manage Projects
app.get('/api/admin/projects', authenticateToken, isAdmin, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  res.json(projects);
});

app.post('/api/admin/projects', authenticateToken, isAdmin, (req, res) => {
  const { name, location, total_value, status, image_url, cctv_url } = req.body;
  const result = db.prepare('INSERT INTO projects (name, location, total_value, status, image_url, cctv_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    name, location, total_value, status, image_url, cctv_url
  );
  res.json({ id: result.lastInsertRowid, name, location });
});

app.patch('/api/admin/projects/:id/cctv', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { cctv_url } = req.body;
  db.prepare('UPDATE projects SET cctv_url = ? WHERE id = ?').run(cctv_url, id);
  res.json({ success: true });
});

// Assign Investor to Project
app.post('/api/admin/assign', authenticateToken, isAdmin, (req, res) => {
  const { user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date } = req.body;
  try {
    db.prepare('INSERT INTO investor_projects (user_id, project_id, contribution, investment_amount, allotted_sqft, market_price_per_sqft, price_at_investment, investment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      user_id, project_id, contribution, investment_amount || 0, allotted_sqft || 0, market_price_per_sqft || 0, price_at_investment || 0, investment_date || null
    );
    res.json({ message: 'Assigned successfully' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Update investor-project financial data
app.patch('/api/admin/investor-project/:userId/:projectId', authenticateToken, isAdmin, (req, res) => {
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
});

// Get all investor-project assignments (for admin edit)
app.get('/api/admin/investor-projects', authenticateToken, isAdmin, (req, res) => {
  const assignments = db.prepare(`
    SELECT ip.*, u.name as investor_name, u.email as investor_email, p.name as project_name
    FROM investor_projects ip
    JOIN users u ON ip.user_id = u.id
    JOIN projects p ON ip.project_id = p.id
    ORDER BY u.name, p.name
  `).all();
  res.json(assignments);
});

// Manage Milestones
app.get('/api/admin/projects/:id/milestones', authenticateToken, isAdmin, (req, res) => {
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(req.params.id);
  res.json(milestones);
});

app.post('/api/admin/milestones', authenticateToken, isAdmin, (req, res) => {
  const { project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url } = req.body;
  const result = db.prepare('INSERT INTO milestones (project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    project_id, category, name, status, start_date, expected_completion, actual_completion, completion_percentage, doc_url
  );
  res.json({ id: result.lastInsertRowid });
});

app.patch('/api/admin/milestones/:id', authenticateToken, isAdmin, (req, res) => {
  const { status, actual_completion, completion_percentage } = req.body;
  db.prepare('UPDATE milestones SET status = ?, actual_completion = ?, completion_percentage = ? WHERE id = ?').run(
    status, actual_completion, completion_percentage, req.params.id
  );
  res.json({ message: 'Updated' });
});

// Manage Updates (Photos/Videos)
app.post('/api/admin/updates', authenticateToken, isAdmin, (req, res) => {
  const { project_id, type, url, caption, date, milestone_id } = req.body;
  const result = db.prepare('INSERT INTO progress_updates (project_id, type, url, caption, date, milestone_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    project_id, type, url, caption, date, milestone_id
  );
  res.json({ id: result.lastInsertRowid });
});

// File Upload endpoint
app.post('/api/upload', authenticateToken, isAdmin, (req, res) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.originalname, mimetype: req.file.mimetype });
  });
});

// --- INVESTOR ROUTES ---

app.get('/api/investor/projects', authenticateToken, (req: any, res) => {
  const projects = db.prepare(`
    SELECT p.*, ip.contribution, ip.investment_amount, ip.allotted_sqft, ip.market_price_per_sqft, ip.price_at_investment, ip.investment_date 
    FROM projects p 
    JOIN investor_projects ip ON p.id = ip.project_id 
    WHERE ip.user_id = ?
  `).all(req.user.id);
  res.json(projects);
});

app.get('/api/investor/projects/:id', authenticateToken, (req: any, res) => {
  // Verify access
  const access: any = db.prepare('SELECT * FROM investor_projects WHERE user_id = ? AND project_id = ?').get(req.user.id, req.params.id);
  if (!access && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const project: any = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  
  // Merge financial data from investor_projects into project
  if (access && project) {
    project.contribution = access.contribution;
    project.investment_amount = access.investment_amount;
    project.allotted_sqft = access.allotted_sqft;
    project.market_price_per_sqft = access.market_price_per_sqft;
    project.price_at_investment = access.price_at_investment;
    project.investment_date = access.investment_date;
  }
  
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(req.params.id);
  const updates = db.prepare('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY date DESC').all(req.params.id);
  const announcements = db.prepare('SELECT * FROM announcements WHERE project_id = ? ORDER BY date DESC').all(req.params.id);
  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.user.id, req.params.id);

  res.json({ project, milestones, updates, announcements, queries });
});

// --- ADVERTISEMENT / NEW PROJECTS FOR INVESTORS ---
app.get('/api/investor/new-projects', authenticateToken, (req: any, res) => {
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
});

// --- QUERY ROUTES ---

// Send a query (works for both)
app.post('/api/queries', authenticateToken, (req: any, res) => {
  const { project_id, message, user_id } = req.body;
  // If investor, user_id comes from token. If admin, user_id must be provided in body (to specify which investor thread)
  const targetUserId = req.user.role === 'admin' ? user_id : req.user.id;

  const result = db.prepare('INSERT INTO queries (user_id, project_id, message, sender_role) VALUES (?, ?, ?, ?)').run(
    targetUserId, project_id, message, req.user.role
  );
  res.json({ id: result.lastInsertRowid, created_at: new Date().toISOString() });
});

// Get queries for a specific project (investor view)
app.get('/api/investor/queries/:projectId', authenticateToken, (req: any, res) => {
  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.user.id, req.params.projectId);
  res.json(queries);
});

// Admin: Get all query threads (unique combinations of user and project)
app.get('/api/admin/queries', authenticateToken, isAdmin, (req, res) => {
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
});

// Admin: Get specific thread
app.get('/api/admin/queries/:userId/:projectId', authenticateToken, isAdmin, (req, res) => {
  const queries = db.prepare('SELECT * FROM queries WHERE user_id = ? AND project_id = ? ORDER BY created_at ASC').all(req.params.userId, req.params.projectId);
  res.json(queries);
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
