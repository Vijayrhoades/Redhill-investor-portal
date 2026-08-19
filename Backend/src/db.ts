import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    login_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    total_value TEXT,
    status TEXT,
    image_url TEXT,
    completion_percentage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investor_projects (
    user_id INTEGER,
    project_id INTEGER,
    contribution TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    PRIMARY KEY(user_id, project_id)
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    category TEXT CHECK(category IN ('documentation', 'approval', 'construction')) NOT NULL,
    name TEXT NOT NULL,
    status TEXT CHECK(status IN ('completed', 'in_progress', 'pending')) NOT NULL,
    start_date TEXT,
    expected_completion TEXT,
    actual_completion TEXT,
    completion_percentage INTEGER DEFAULT 0,
    doc_url TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS progress_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    type TEXT CHECK(type IN ('photo', 'video')) NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    date TEXT NOT NULL,
    milestone_id INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(milestone_id) REFERENCES milestones(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sender_role TEXT CHECK(sender_role IN ('admin', 'investor')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('invoice', 'receipt')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'paid')) NOT NULL,
    description TEXT,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    milestone_id INTEGER,
    user_id INTEGER,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    content_html TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(milestone_id) REFERENCES milestones(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add login_id if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasLoginId = tableInfo.some(col => col.name === 'login_id');

if (!hasLoginId) {
    try {
        db.exec('ALTER TABLE users ADD COLUMN login_id TEXT');
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id)');
        console.log('Migration: Added login_id column to users table.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

const tableInfoProjects = db.prepare("PRAGMA table_info(projects)").all() as any[];
const hasCctvUrl = tableInfoProjects.some(col => col.name === 'cctv_url');
if (!hasCctvUrl) {
    try {
        db.exec('ALTER TABLE projects ADD COLUMN cctv_url TEXT');
        console.log('Migration: Added cctv_url column to projects table.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

// Migration: Add financial columns to investor_projects
const ipTableInfo = db.prepare("PRAGMA table_info(investor_projects)").all() as any[];
const hasInvestmentAmount = ipTableInfo.some((col: any) => col.name === 'investment_amount');
if (!hasInvestmentAmount) {
    try {
        db.exec('ALTER TABLE investor_projects ADD COLUMN investment_amount REAL DEFAULT 0');
        db.exec('ALTER TABLE investor_projects ADD COLUMN allotted_sqft REAL DEFAULT 0');
        db.exec('ALTER TABLE investor_projects ADD COLUMN market_price_per_sqft REAL DEFAULT 0');
        console.log('Migration: Added financial columns to investor_projects table.');
    } catch (e) {
        console.error('Migration for investor_projects failed:', e);
    }
}

// Migration: Add price_at_investment and investment_date columns
const hasPriceAtInvestment = ipTableInfo.some((col: any) => col.name === 'price_at_investment');
if (!hasPriceAtInvestment) {
    try {
        db.exec('ALTER TABLE investor_projects ADD COLUMN price_at_investment REAL DEFAULT 0');
        db.exec('ALTER TABLE investor_projects ADD COLUMN investment_date TEXT');
        console.log('Migration: Added price_at_investment and investment_date columns to investor_projects table.');
    } catch (e) {
        console.error('Migration for price_at_investment failed:', e);
    }
}

// Migration: Add target_days, current_day, notes, last_updated_at to milestones
const milestoneTableInfo = db.prepare("PRAGMA table_info(milestones)").all() as any[];
const hasTargetDays = milestoneTableInfo.some((col: any) => col.name === 'target_days');
if (!hasTargetDays) {
    try {
        db.exec('ALTER TABLE milestones ADD COLUMN target_days INTEGER DEFAULT 0');
        db.exec('ALTER TABLE milestones ADD COLUMN current_day INTEGER DEFAULT 0');
        db.exec('ALTER TABLE milestones ADD COLUMN notes TEXT');
        db.exec('ALTER TABLE milestones ADD COLUMN last_updated_at DATETIME');
        console.log('Migration: Added target_days, current_day, notes, last_updated_at to milestones table.');
    } catch (e) {
        console.error('Migration for milestones columns failed:', e);
    }
}

// Migration: Add day_number to progress_updates
const progressTableInfo = db.prepare("PRAGMA table_info(progress_updates)").all() as any[];
const hasDayNumber = progressTableInfo.some((col: any) => col.name === 'day_number');
if (!hasDayNumber) {
    try {
        db.exec('ALTER TABLE progress_updates ADD COLUMN day_number INTEGER');
        console.log('Migration: Added day_number to progress_updates table.');
    } catch (e) {
        console.error('Migration for progress_updates failed:', e);
    }
}

export default db;