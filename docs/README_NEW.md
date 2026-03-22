# AWYAD MES System

**Professional Monitoring, Evaluation, and Reporting System**

A production-ready web application for tracking activities, managing projects, monitoring indicators, and handling cases for development programs.

## 🚀 Features

- **Dashboard**: Real-time statistics and overview of all activities
- **Project Management**: Track projects, budgets, and timelines
- **Activity Tracking**: Monitor planned and completed activities
- **Indicator Tracking**: Measure progress against targets
- **Case Management**: Handle and track individual cases
- **Monthly Reporting**: Generate comprehensive monthly reports
- **Data Export**: Export data to CSV/Excel formats
- **RESTful API**: Complete API for integration with other systems

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

Check your versions:
```bash
node --version
npm --version
```

## 🛠️ Installation

1. **Clone or navigate to the repository**:
   ```bash
   cd c:\Users\DELL\awyad-mes-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   copy .env.example .env
   
   # Edit .env with your preferred settings (optional for local development)
   ```

4. **Prepare data directory**:
   ```bash
   # The data directory is created automatically
   # Copy mockData.js to data directory if not already done
   copy mockData.js data\mockData.js
   ```

## 🚀 Running the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start at: **http://localhost:3000**

### Available Scripts:

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier
- `npm run build` - Run linting and tests

## 📁 Project Structure

```
awyad-mes-demo/
├── src/
│   ├── client/              # Frontend code
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # Client-side services (API, state)
│   │   └── utils/           # Client utilities
│   ├── server/              # Backend code
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic & data access
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Server utilities
│   │   └── index.js         # Server entry point
│   └── shared/              # Shared code (constants, validators)
├── public/                  # Static files (HTML, CSS, client JS)
├── data/                    # Data files (JSON, CSV)
├── config/                  # Configuration files
├── tests/                   # Test files
├── logs/                    # Application logs
├── .env                     # Environment variables (not in git)
├── .env.example             # Example environment variables
├── .eslintrc.cjs            # ESLint configuration
├── .prettierrc.json         # Prettier configuration
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
└── README.md                # This file
```

## 🔌 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently, the API does not require authentication. In production, implement proper authentication (JWT, OAuth, etc.).

### Endpoints

#### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/overview` - Get complete dashboard overview

#### Projects
- `GET /projects` - Get all projects (with filtering & pagination)
- `GET /projects/:id` - Get single project
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Activities
- `GET /activities` - Get all activities (with filtering & pagination)
- `GET /activities/:id` - Get single activity
- `POST /activities` - Create new activity
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity

### Query Parameters

Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction ('asc' or 'desc')
- `status` - Filter by status
- `search` - Search term
- Additional filters specific to the resource

### Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": [ ... ],
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

### Example Requests

**Get all activities:**
```bash
curl http://localhost:3000/api/v1/activities?page=1&limit=10
```

**Create a new activity:**
```bash
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d '{
    "thematicAreaId": "TA-001",
    "indicatorId": "IND-001",
    "projectId": "PRJ-001",
    "activityName": "Community Training Session",
    "status": "Planned",
    "location": "Kampala",
    "plannedDate": "2026-02-15",
    "beneficiaries": {
      "direct": { "male": 20, "female": 30, "other": 0 },
      "indirect": { "male": 10, "female": 15, "other": 0 }
    }
  }'
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🎨 Code Style

This project uses ESLint and Prettier for code quality and formatting.

**Check for linting errors:**
```bash
npm run lint
```

**Auto-fix linting errors:**
```bash
npm run lint:fix
```

**Format all code:**
```bash
npm run format
```

## 📝 Environment Variables

Key environment variables (in `.env`):

```env
NODE_ENV=development          # Environment (development/production)
PORT=3000                     # Server port
HOST=localhost                # Server host
API_BASE_URL=/api/v1         # API base path
CORS_ORIGIN=http://localhost:3000  # Allowed CORS origin
LOG_LEVEL=debug              # Logging level
DATA_DIR=./data              # Data directory path
```

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting on API endpoints
- Input validation with Joi
- SQL injection prevention (when database is added)
- XSS protection

## 📊 Data Management

### Initial Data
- Data is loaded from `mockData.js` on first run
- Converted and stored as JSON in `data/data.json`
- All changes are persisted to the JSON file

### CSV Import (Future)
The system supports CSV import. Place CSV files in the `data/` directory.

### Database Migration (Future)
To migrate to a database:
1. Install database driver (e.g., `pg` for PostgreSQL)
2. Update `dataService.js` to use database queries
3. Create database schema and migrations
4. Update `.env` with database credentials

## 🚀 Deployment

### Deploy to Production Server

1. **Set environment to production**:
   ```bash
   NODE_ENV=production
   ```

2. **Install only production dependencies**:
   ```bash
   npm install --production
   ```

3. **Start with process manager (PM2)**:
   ```bash
   npm install -g pm2
   pm2 start src/server/index.js --name awyad-mes
   pm2 save
   pm2 startup
   ```

### Deploy to Cloud

**Heroku:**
```bash
# Install Heroku CLI and login
heroku create awyad-mes
git push heroku main
heroku config:set NODE_ENV=production
```

**AWS/Azure/GCP:**
- Use container deployment (Docker)
- Configure environment variables
- Set up load balancer and auto-scaling
- Configure database connection

## 🐛 Troubleshooting

### Port already in use
Change the port in `.env`:
```env
PORT=3001
```

### Module not found errors
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Data not loading
1. Check that `mockData.js` exists in `data/` directory
2. Check logs in `logs/` directory
3. Verify file permissions

## 📚 Additional Documentation

- [API Documentation](./docs/API.md) - Detailed API reference (to be created)
- [Development Guide](./docs/DEVELOPMENT.md) - Development guidelines (to be created)
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

ISC License

## 👥 Team

AWYAD Development Team

## 📞 Support

For issues or questions:
- Check the logs in `logs/` directory
- Review error messages in the console
- Contact the development team

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
