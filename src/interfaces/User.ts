// Main user interface matching the users table
export interface User {
  id: number;
  email: string;
  password: string;
  status: number; // 0 = inactive, 1 = active, etc.
  verified: boolean;
  resettable: boolean;
  registered: number; // Unix timestamp
  last_login?: number; // Unix timestamp, optional
  force_logout: number;
}

// User details interface matching the user_details table
export interface UserDetails {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
}

// Combined user interface for API responses
export interface UserWithDetails extends User {
  details?: UserDetails;
}

// User creation interface (for registration)
export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
}

// User login interface
export interface LoginInput {
  email: string;
  password: string;
}

// User update interface
export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
}

// Password update interface
export interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}


// API Response interfaces
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<UserWithDetails, 'password'>;
  token?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: Omit<UserWithDetails, 'password'>;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

// Enums for better type safety
export enum UserStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  SUSPENDED = 2,
  BANNED = 3
}

export enum UserType {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin'
}

// JWT Payload interface
export interface JWTPayload {
  id: number;
  email: string;
  verified: boolean;
  status: number;
  force_logout: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Validation interfaces
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}