import { Router, Request, Response } from 'express';
import * as userController from '../../controllers/userController';
import { UpdateUserInput } from '../../interfaces/User';
import { authenticateToken } from '../../middleware/auth';
import { sanitizeUserInput } from '../../utils/routeHelpers';

const router = Router();

// Helper function for error responses
const errorResponse = (res: Response, status: number, message: string) => 
  res.status(status).json({ success: false, message });

const successResponse = (res: Response, message: string, data?: any) => 
  res.json({ success: true, message, ...data });

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return errorResponse(res, 401, 'Unauthorized');
    
    const user = await userController.getUserById(req.user.id);
    const { password: _, ...userResponse } = user;
    successResponse(res, 'User profile retrieved successfully', { user: userResponse });
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});
// Get all users with pagination
router.get('/all', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse(res, 400, 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100');
    }
    
    const users = await userController.getAllUsers(page, limit);
    const sanitizedUsers = users.map(user => {
      const { password: _, ...userResponse } = user;
      return userResponse;
    });
    
    successResponse(res, 'All users retrieved successfully', { 
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total: sanitizedUsers.length
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Get user profile by ID
// This route should come AFTER specific routes like /me and /all
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    const user = await userController.getUserById(userId);
    const { password: _, ...userResponse } = user;
    successResponse(res, 'User retrieved successfully', { user: userResponse });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return errorResponse(res, 404, 'User not found');
    }
    console.error('Get user error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Update current user profile (convenience endpoint)
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return errorResponse(res, 401, 'Unauthorized');

    // Validate and sanitize input
    const updateData: UpdateUserInput = sanitizeUserInput(req.body);
    

    const updatedUser = await userController.updateUser(req.user.id, updateData);
    const { password: _, ...userResponse } = updatedUser;
    successResponse(res, 'Profile updated successfully', { user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    errorResponse(res, 500, 'Internal server error');
  }
});

export default router;
