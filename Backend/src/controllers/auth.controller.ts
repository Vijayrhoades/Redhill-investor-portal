import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'redhill-infra-secret-key';

export const login = (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ? OR login_id = ?').get(email, email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
};

export const signup = (req: AuthRequest, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

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
};

export const logout = (_req: AuthRequest, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ message: 'Logged out' });
};

export const getMe = (req: AuthRequest, res: Response) => {
  res.json(req.user);
};
