import bcrypt from 'bcrypt';
import {db} from '../db/connection';
import { CreateUserInput,
  UpdateUserInput,
  User,
  UserWithDetails
 } from "../interfaces/User";

// CRUD Operations for Users
export const createUser = async (userData: CreateUserInput): Promise<UserWithDetails> => {
  const { email, password, first_name, last_name, address, city, state, country, postal_code, phone } = userData;
  
  // Hash password with higher salt rounds for better security
  const hashedPassword = await bcrypt.hash(password, 14);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, registered) VALUES (?, ?, ?)',
      [email, hashedPassword, currentTimestamp]
    ) as any;
    
    const userId = userResult.insertId;
    
    // Insert user details
    await connection.query(
      'INSERT INTO user_details (user_id, first_name, last_name, address, city, state, country, postal_code, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, first_name, last_name, address || null, city || null, state || null, country || null, postal_code || null, phone || null]
    );
    
    await connection.commit();
    
    // Return created user with details
    return await getUserById(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    throw new Error('Failed to create user. Please try again.');
  } finally {
    connection.release();
  }
};

export const getUserById = async (id: number): Promise<UserWithDetails> => {
  if (!id || id <= 0) {
    throw new Error('Invalid user ID provided');
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, u.email, u.status, u.verified, u.resettable, u.registered, u.last_login, u.force_logout,
        ud.first_name, ud.last_name, ud.address, ud.city, ud.state, ud.country, ud.postal_code, ud.phone
      FROM users u
      LEFT JOIN user_details ud ON u.id = ud.user_id
      WHERE u.id = ?
    `, [id]) as any;
    
    if (!rows.length) {
      throw new Error('User not found');
    }
    
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      password: '', 
      status: row.status,
      verified: Boolean(row.verified),
      resettable: Boolean(row.resettable),
      registered: row.registered,
      last_login: row.last_login,
      force_logout: row.force_logout,
      details: row.first_name ? {
        id: row.id,
        user_id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        postal_code: row.postal_code,
        phone: row.phone
      } : undefined
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email provided');
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    ) as any;
    
    if (!rows.length) {
      return null;
    }
    
    return rows[0] as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: UpdateUserInput): Promise<UserWithDetails> => {
  if (!id || id <= 0) {
    throw new Error('Invalid user ID provided');
  }

  const { first_name, last_name, address, city, state, country, postal_code, phone } = userData;
  
  try {
    // Check if user exists first
    await getUserById(id);
    
    const [result] = await db.query(
      'UPDATE user_details SET first_name = ?, last_name = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?, phone = ? WHERE user_id = ?',
      [first_name, last_name, address || null, city || null, state || null, country || null, postal_code || null, phone || null, id]
    ) as any;
    
    if (result.affectedRows === 0) {
      throw new Error('No user details found to update');
    }
    
    return await getUserById(id);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserStatus = async (id: number, status: number): Promise<void> => {
  try {
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const updateUserVerification = async (id: number, verified: boolean): Promise<void> => {
  try {
    await db.query('UPDATE users SET verified = ? WHERE id = ?', [verified ? 1 : 0, id]);
  } catch (error) {
    console.error('Error updating user verification:', error);
    throw error;
  }
};

export const updateLastLogin = async (id: number): Promise<void> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  try {
    await db.query('UPDATE users SET last_login = ? WHERE id = ?', [currentTimestamp, id]);
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Force logout user by incrementing force_logout counter
export const updateForceLogout = async (id: number): Promise<void> => {
  try {
    await db.query('UPDATE users SET force_logout = force_logout + 1 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error updating force logout:', error);
    throw error;
  }
};
