import { Router, Request, Response } from 'express';
import * as userController from '../../controllers/userController';
import { CreateUserInput, LoginInput } from '../../interfaces/User';
import { generateToken } from '../../utils/auth';
import { authenticateToken } from '../../middleware/auth';
import { validateEmail, validatePasswordRegister , validatePasswordLogin,errorResponse, successResponse } from '../../utils/routeHelpers';

const router = Router();


// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body as CreateUserInput;
    
    // Input validation
    if (!email || !password || !first_name || !last_name) {
      return errorResponse(res, 400, 'Email, password, first name, and last name are required');
    }

    if (!validateEmail(email)) {
      return errorResponse(res, 400, 'Invalid email format');
    }

    const passwordValidation = validatePasswordRegister(password);
    if (!passwordValidation.valid) {
      return errorResponse(res, 400, passwordValidation.message!);
    }

    // Sanitize input
    const sanitizedData: CreateUserInput = {
      ...req.body,
      email: email.toLowerCase().trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim()
    };

    const existingUser = await userController.getUserByEmail(sanitizedData.email);
    if (existingUser) {
      return errorResponse(res, 409, 'User with this email already exists');
    }

    const newUser = await userController.createUser(sanitizedData);
    
    // Don't return sensitive data
    const { password: _, ...userResponse } = newUser;
    successResponse(res, 'User registered successfully', { user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    errorResponse(res, 500, 'Internal server error');
  }
});

// User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;
    
    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    if (!validateEmail(email)) {
      return errorResponse(res, 400, 'Invalid email format');
    }

    const user = await userController.getUserByEmail(email.toLowerCase().trim());
    if (!user || !(await validatePasswordLogin(password, user.password))) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check if user is banned or suspended
    if (user.status === 2 || user.status === 3) {
      return errorResponse(res, 403, 'Account is suspended or banned');
    }

    // Automatically activate user on successful login
    if (user.status === 0) {
      await userController.updateUserStatus(user.id, 1);
      user.status = 1; // Update local copy for token generation
    }

    await userController.updateLastLogin(user.id);
    const userWithDetails = await userController.getUserById(user.id);
    const token = generateToken(user);

    // Don't return password
    const { password: _, ...userResponse } = userWithDetails;
    successResponse(res, 'Login successful', { user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    errorResponse(res, 500, 'Internal server error');
  }
});

// User logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return errorResponse(res, 401, 'Unauthorized');
    
    // Increment force_logout to invalidate all existing tokens
    await userController.updateForceLogout(req.user.id);
    
    successResponse(res, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

export default router;
