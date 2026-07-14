import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import routes from './routes/index.js';
import dataService from './services/dataService.js';
import databaseService from './services/databaseService.js';
import authService from './services/authService.js';
import { runPendingMigrations } from '../../database/migrate.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Base path for sub-path deployments (e.g. APP_BASE_PATH=/me-platform).
// Leave blank (or unset) for root deployment (e.g. https://awyad.3bs.ltd).
const BASE_PATH = (process.env.APP_BASE_PATH || '').replace(/\/$/, '');

// Helper: serve an HTML file with runtime config + optional <base> tag injected.
const publicDir = path.join(process.cwd(), 'public');
function serveInjectedHtml(filePath, res) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    // <base> tag makes relative URLs (css/*, js/*, *.html) resolve under BASE_PATH
    if (BASE_PATH) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n  <base href="${BASE_PATH}/">`);
    }
    // Runtime config injected before </head> so every script can read it
    const cfg = `<script>window.APP_BASE_PATH=${JSON.stringify(BASE_PATH)};` +
                `window.APP_API_BASE=${JSON.stringify(BASE_PATH + '/api/v1')};</script>`;
    html = html.replace('</head>', cfg + '\n</head>');
    res.type('html').send(html);
  } catch {
    res.sendStatus(404);
  }
}

// Trust the first proxy (Nginx reverse proxy)
app.set('trust proxy', 1);

// ============ Security Middleware ============

// Helmet for security headers
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
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
app.use((BASE_PATH || '') + '/api', limiter);

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

// ============ HTML Routes (must come BEFORE express.static) ============
// Serve all .html files via serveInjectedHtml so APP_BASE_PATH is always
// available to every page regardless of deployment style.

// Root / index
app.get(BASE_PATH + '/', (req, res) => serveInjectedHtml(path.join(publicDir, 'index.html'), res));
if (BASE_PATH) {
  // Redirect bare /me-platform → /me-platform/
  app.get(BASE_PATH, (req, res) => res.redirect(301, BASE_PATH + '/'));
}
// Any other .html page under the base path
app.get(BASE_PATH + '/*.html', (req, res) => {
  const safeName = path.basename(req.path);
  serveInjectedHtml(path.join(publicDir, safeName), res);
});

// ============ Static Files ============

// Non-HTML static assets (CSS, JS, images, fonts, etc.)
app.use(BASE_PATH || '/', express.static(publicDir, { index: false }));

// Backward-compat: also serve root-level JS/CSS files (transition period)
app.use(BASE_PATH || '/', express.static(process.cwd(), {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
      res.setHeader('Content-Type', filePath.endsWith('.js') ? 'application/javascript' :
                                    filePath.endsWith('.html') ? 'text/html' : 'text/css');
    }
  }
}));

// ============ API Routes ============

const API_BASE = BASE_PATH + (process.env.API_BASE_URL || '/api/v1');
app.use(API_BASE, routes);

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

      // Run any pending SQL migrations automatically
      try {
        const { applied } = await runPendingMigrations();
        if (applied > 0) {
          logger.info(`✅ Applied ${applied} pending database migration(s)`);
        } else {
          logger.info('✅ Database schema is up to date');
        }
      } catch (migErr) {
        logger.error('⚠️  Migration error (server will continue):', migErr.message);
      }

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
    if (BASE_PATH) logger.info(`📂 Base path: ${BASE_PATH}`);
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
