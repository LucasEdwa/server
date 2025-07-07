import { initializeUserTables } from '../models/User';
import { db } from '../db/connection';

const runMigration = async () => {
  try {
    console.log('Starting migration...');
    await initializeUserTables();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
