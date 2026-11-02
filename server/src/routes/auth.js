import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { COOKIE_NAME, cookieOptions, signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Public sign-up always creates a "patient". Only an admin can promote users.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required.' });
  if (!emailOk(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (!password || password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: 'An account with this email already exists.' });

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: 'patient',
  });
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ message: 'Incorrect email or password.' });

  res.cookie(COOKIE_NAME, signToken(user), cookieOptions);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ message: 'Logged out.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
