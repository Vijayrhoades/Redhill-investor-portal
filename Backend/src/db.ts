import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('database.sqlite');
const db = new Database(dbPath);

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

// Initialize investment_ledger table
db.exec(`
  CREATE TABLE IF NOT EXISTS investment_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('initial_assignment', 'sub_investment', 'adjustment')) NOT NULL,
    investment_amount REAL DEFAULT 0,
    allotted_sqft REAL DEFAULT 0,
    price_at_investment REAL DEFAULT 0,
    market_price_per_sqft REAL DEFAULT 0,
    contribution TEXT,
    note TEXT,
    transaction_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

// Backfill migration: Populate ledger for existing assignments if ledger is empty
try {
  const ledgerCount = (db.prepare('SELECT COUNT(*) as count FROM investment_ledger').get() as any)?.count || 0;
  if (ledgerCount === 0) {
    const existingAssignments = db.prepare('SELECT * FROM investor_projects').all() as any[];
    for (const a of existingAssignments) {
      db.prepare(`
        INSERT INTO investment_ledger (
          user_id, project_id, transaction_type, investment_amount, allotted_sqft,
          price_at_investment, market_price_per_sqft, contribution, note, transaction_date
        ) VALUES (?, ?, 'initial_assignment', ?, ?, ?, ?, ?, 'Initial assignment backfill', ?)
      `).run(
        a.user_id,
        a.project_id,
        a.investment_amount || 0,
        a.allotted_sqft || 0,
        a.price_at_investment || 0,
        a.market_price_per_sqft || 0,
        a.contribution || '',
        a.investment_date || new Date().toISOString().split('T')[0]
      );
    }
    console.log(`Migration: Backfilled ${existingAssignments.length} initial entries into investment_ledger.`);
  }
} catch (e) {
  console.error('Migration for investment_ledger backfill failed:', e);
}

export default db;