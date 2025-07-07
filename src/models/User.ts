import { db } from '../db/connection';

// Users main table
export const createUsersTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(249) COLLATE utf8mb4_unicode_ci NOT NULL,
      password VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      status TINYINT(2) UNSIGNED NOT NULL DEFAULT '0',
      verified TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
      resettable TINYINT(1) UNSIGNED NOT NULL DEFAULT '1',
      registered INT(10) UNSIGNED NOT NULL DEFAULT 0,
      last_login INT(10) UNSIGNED DEFAULT NULL,
      force_logout MEDIUMINT(7) UNSIGNED NOT NULL DEFAULT '0',
      user_type ENUM('guest', 'user', 'super_admin') NOT NULL DEFAULT 'user',
      UNIQUE KEY id (id),
      UNIQUE KEY email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersConfirmationsTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_confirmations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      email VARCHAR(249) COLLATE utf8mb4_unicode_ci NOT NULL,
      selector VARCHAR(16) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY email_expires (email,expires),
      KEY user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersRememberedTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_remembered (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      selector VARCHAR(24) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersResetsTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_resets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      selector VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY user_id_expires (user_id,expires),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersThrottlingTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_throttling (
      bucket VARCHAR(44) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL PRIMARY KEY,
      tokens FLOAT UNSIGNED NOT NULL,
      replenished_at INT(10) UNSIGNED NOT NULL,
      expires_at INT(10) UNSIGNED NOT NULL,
      KEY expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUserDetailsTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_details (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      first_name VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      last_name VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      address VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      city VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      state VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      country VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      postal_code VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      phone VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// Migration function to add user_type column to existing table
export const addUserTypeColumn = async (): Promise<void> => {
  try {
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'user_type' 
      AND TABLE_SCHEMA = DATABASE()
    `) as any;

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN user_type ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user' 
        AFTER force_logout
      `);
      console.log('user_type column added successfully');
    } else {
      console.log('user_type column already exists');
    }
  } catch (error) {
    console.error('Error adding user_type column:', error);
    throw error;
  }
};

// Initialize all user-related tables
export const initializeUserTables = async (): Promise<void> => {
  try {
    await createUsersTable();
    await createUserDetailsTable();
    await createUsersConfirmationsTable();
    await createUsersRememberedTable();
    await createUsersResetsTable();
    await createUsersThrottlingTable();
    
    // Add user_type column if it doesn't exist
    await addUserTypeColumn();
    
    console.log('All user tables initialized successfully');
  } catch (error) {
    console.error('Error initializing user tables:', error);
    throw error;
  }
};