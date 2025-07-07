import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import { initializeUserTables } from "./models/User";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the E-commerce API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      health: "/health"
    }
  });
});


// API Routes
app.use("/api/users", userRoutes);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database tables and start server
const startServer = async () => {
  try {
    console.log('Initializing database tables...');
    await initializeUserTables();
    
  
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}`);
      console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();