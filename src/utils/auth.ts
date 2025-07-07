import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { User} from '../interfaces/User';
import { db } from '../db/connection';

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
