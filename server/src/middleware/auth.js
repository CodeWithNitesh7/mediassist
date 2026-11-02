import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'hc_token';

export const cookieOptions = {
  httpOnly: true,

  // HTTPS production frontend/backend ke liye
  secure: true,

  // Netlify frontend + Render backend = cross-site
  sameSite: 'none',

  // Cookie all backend routes ke liye
  path: '/',

  // 7 days
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Create JWT token
 */
export function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

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
    secure: true,
    sameSite: 'none',
    path: '/',
  });
}
