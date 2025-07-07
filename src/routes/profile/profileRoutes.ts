import { Router, Request, Response } from 'express';
import * as userController from '../../controllers/userController';
import { UpdateUserInput } from '../../interfaces/User';
import { authenticateToken } from '../../middleware/auth';

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

// Get user profile by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    // Only allow users to view their own profile or if they're admin
    if (req.user?.id !== userId && (req.user?.status ?? 0) < 2) {
      return errorResponse(res, 403, 'Access denied');
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
    const updateData: UpdateUserInput = {};

    if (req.body.first_name) updateData.first_name = req.body.first_name.trim();
    if (req.body.last_name) updateData.last_name = req.body.last_name.trim();
    if (req.body.address) updateData.address = req.body.address.trim();
    if (req.body.city) updateData.city = req.body.city.trim();
    if (req.body.state) updateData.state = req.body.state.trim();
    if (req.body.country) updateData.country = req.body.country.trim();
    if (req.body.postal_code) updateData.postal_code = req.body.postal_code.trim();
    if (req.body.phone) updateData.phone = req.body.phone.trim();

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
