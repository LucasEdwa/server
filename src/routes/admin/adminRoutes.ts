import { Router, Request, Response } from 'express';
import * as userController from '../../controllers/userController';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { errorResponse, successResponse } from '../../utils/routeHelpers';

const router = Router();


// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Delete user account (admin only)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === userId) {
      return errorResponse(res, 400, 'Cannot delete your own account');
    }

    await userController.deleteUser(userId);
    successResponse(res, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Update user status (admin only)
router.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    if (typeof status !== 'number' || status < 0 || status > 3) {
      return errorResponse(res, 400, 'Invalid status. Must be 0-3 (0=inactive, 1=active, 2=suspended, 3=banned)');
    }

    // Prevent admin from changing their own status
    if (req.user?.id === userId) {
      return errorResponse(res, 400, 'Cannot change your own status');
    }

    await userController.updateUserStatus(userId, status);
    successResponse(res, 'User status updated successfully');
  } catch (error) {
    console.error('Update user status error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Update user verification status (admin only)
router.patch('/users/:id/verification', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { verified } = req.body;

    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    if (typeof verified !== 'boolean') {
      return errorResponse(res, 400, 'Verified must be a boolean value');
    }

    await userController.updateUserVerification(userId, verified);
    successResponse(res, 'User verification status updated successfully');
  } catch (error) {
    console.error('Update user verification error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Force logout user (admin only)
router.post('/users/:id/force-logout', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    // Prevent admin from force logging out themselves
    if (req.user?.id === userId) {
      return errorResponse(res, 400, 'Cannot force logout yourself');
    }

    await userController.updateForceLogout(userId);
    successResponse(res, 'User force logout successful');
  } catch (error) {
    console.error('Force logout error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Get all users (admin only) - with pagination
router.get('/users*=', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // This would require implementing pagination in userController
    // For now, returning a simple message
    successResponse(res, 'Get all users endpoint - pagination to be implemented');
  } catch (error) {
    console.error('Get all users error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});


export default router;
