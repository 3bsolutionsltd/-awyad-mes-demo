import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import routes from './routes/index.js';
import dataService from './services/dataService.js';
import databaseService from './services/databaseService.js';
import authService from './services/authService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ============ Security Middleware ============

// Helmet for security headers
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : (isProd ? [] : ['*']);

const corsOptions = {
  origin: isProd
    ? (origin, cb) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return cb(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      }
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});
app.use('/api', limiter);

// ============ General Middleware ============

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// ============ Static Files ============

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve old files from root for backward compatibility (during transition)
app.use(express.static(process.cwd(), {
  index: false,
  setHeaders: (res, filePath) => {
    // Only serve specific file types
    if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
      res.setHeader('Content-Type', filePath.endsWith('.js') ? 'application/javascript' : 
                                    filePath.endsWith('.html') ? 'text/html' : 'text/css');
    }
  }
}));

// ============ API Routes ============

const API_BASE = process.env.API_BASE_URL || '/api/v1';
app.use(API_BASE, routes);

// ============ Root Route ============

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'), (err) => {
    if (err) {
      // Fallback to root index.html if public version doesn't exist
      res.sendFile(path.join(process.cwd(), 'index.html'));
    }
  });
});

// ============ Error Handling ============

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============ Server Initialization ============

const startServer = async () => {
  try {
    // Initialize database service
    logger.info('Initializing database connection...');
    const useDatabase = process.env.USE_DATABASE === 'true';
    
    if (useDatabase) {
      await databaseService.initialize();
      logger.info('✅ Database connection established');
      
      // Start token cleanup job (every hour)
      setInterval(() => {
        authService.cleanupExpiredTokens();
      }, 60 * 60 * 1000);
    } else {
      logger.info('📝 Using JSON file-based data storage (no database)');
      // Initialize data service for JSON-based storage
      await dataService.initialize();
    }
    
    // Start server
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
      logger.info(`📊 API available at http://${HOST}:${PORT}${API_BASE}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💾 Storage: ${useDatabase ? 'PostgreSQL Database' : 'JSON Files'}`);
      logger.info(`✅ Server started successfully`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
