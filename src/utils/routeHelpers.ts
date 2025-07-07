import { Response } from 'express';
import bcrypt from 'bcrypt';
// Helper function for error responses
export const errorResponse = (res: Response, status: number, message: string) => 
  res.status(status).json({ success: false, message });

export const successResponse = (res: Response, message: string, data?: any) => 
  res.json({ success: true, message, ...data });

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePasswordRegister = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
  }
  return { valid: true };
};
// Helper function to validate password with better security
export const validatePasswordLogin = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
};

export const validateId = (id: string): { valid: boolean; id?: number; message?: string } => {
  const parsedId = parseInt(id);
  if (isNaN(parsedId) || parsedId <= 0) {
    return { valid: false, message: 'Invalid ID format' };
  }
  return { valid: true, id: parsedId };
};

// Sanitization helpers
export const sanitizeString = (input: string): string => {
  return input ? input.trim() : '';
};

export const sanitizeEmail = (email: string): string => {
  return email ? email.toLowerCase().trim() : '';
};

// Comprehensive user input sanitization
export const sanitizeUserInput = (input: any): any => {
  return {
    ...input,
    email: input.email ? sanitizeEmail(input.email) : undefined,
    first_name: input.first_name ? sanitizeString(input.first_name) : undefined,
    last_name: input.last_name ? sanitizeString(input.last_name) : undefined,
    address: input.address ? sanitizeString(input.address) : undefined,
    city: input.city ? sanitizeString(input.city) : undefined,
    state: input.state ? sanitizeString(input.state) : undefined,
    country: input.country ? sanitizeString(input.country) : undefined,
    postal_code: input.postal_code ? sanitizeString(input.postal_code) : undefined,
    phone: input.phone ? sanitizeString(input.phone) : undefined
  };
};
