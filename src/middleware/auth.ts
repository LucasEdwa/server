import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getUserById } from '../controllers/userController';
import { User } from '../interfaces/User';
import { db } from '../db/connection';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User; 
    }
  }
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload = { 
    id: user.id, 
    email: user.email,
    verified: user.verified,
    status: user.status,
    force_logout: user.force_logout,
    iat: Math.floor(Date.now() / 1000) // Issue timestamp
  };
  
  const options: SignOptions = { 
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'webshop-store',
    audience: 'webshop-users'
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'webshop-store',
      audience: 'webshop-users'
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

// Clean up expired tokens
export const cleanupExpiredTokens = async (): Promise<void> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  try {
    // Clean up expired confirmation tokens
    await db.query(
      'DELETE FROM users_confirmations WHERE expires < ?',
      [currentTimestamp]
    );
    
    // Clean up expired reset tokens
    await db.query(
      'DELETE FROM users_resets WHERE expires < ?',
      [currentTimestamp]
    );
    
    // Clean up expired remember tokens
    await db.query(
      'DELETE FROM users_remembered WHERE expires < ?',
      [currentTimestamp]
    );
    
    // Clean up expired throttling entries
    await db.query(
      'DELETE FROM users_throttling WHERE expires_at < ?',
      [currentTimestamp]
    );
    
    console.log('Expired tokens cleanup completed');
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

// JWT Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get fresh user data
    const user = await getUserById(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    // Check if user is active
    if (user.status === 0) {
      res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
      return;
    }

    // Check if token was issued before force logout
    if (decoded.iat && decoded.iat < user.force_logout) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || (req.user.user_type !== 'admin' )) {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
};

