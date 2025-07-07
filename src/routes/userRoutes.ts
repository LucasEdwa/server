import { Router } from 'express';
import authRoutes from './auth/authRoutes';
import profileRoutes from './profile/profileRoutes';
import adminRoutes from './admin/adminRoutes';

const router = Router();

// Authentication routes
// POST /api/users/register
// POST /api/users/login  
// POST /api/users/logout
router.use('/', authRoutes);

// Profile management routes
// GET /api/users/me
// PUT /api/users/me
// GET /api/users/:id
router.use('/', profileRoutes);

// Admin routes
// DELETE /api/users/admin/users/:id
// PATCH /api/users/admin/users/:id/status
// PATCH /api/users/admin/users/:id/verification
// POST /api/users/admin/users/:id/force-logout
// GET /api/users/admin/users
router.use('/admin', adminRoutes);

export default router;