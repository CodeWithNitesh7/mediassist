import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'hc_token';

const isProduction = process.env.NODE_ENV === 'production';

export const cookieOptions = {
  httpOnly: true,

  // Production HTTPS ke liye
  secure: isProduction,

  // Frontend aur backend different domains par hain
  sameSite: isProduction ? 'none' : 'lax',

  // Cookie har API route par available rahegi
  path: '/',

  // 7 days
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Create JWT token
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

/**
 * Authentication middleware
 *
 * Checks:
 * 1. Cookie exists
 * 2. JWT is valid
 * 3. User still exists in database
 *
 * If valid:
 * req.user = user
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        message: 'Please log in to continue.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Account no longer exists.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    return res.status(401).json({
      message: 'Session expired. Please log in again.',
    });
  }
}

/**
 * Role based authorization
 *
 * Example:
 * router.get('/admin', requireAuth, requireRole('admin'), ...)
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Please log in to continue.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to do that.',
      });
    }

    next();
  };

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}
