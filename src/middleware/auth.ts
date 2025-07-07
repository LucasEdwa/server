import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { getUserById } from '../controllers/userController';
import { User } from '../interfaces/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User; 
    }
  }
}

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
    if (!req.user || req.user.status < 2) { // Assuming status 2+ is admin
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
