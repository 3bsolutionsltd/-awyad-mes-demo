# Development Best Practices Guide

This document outlines the professional development practices implemented in this system.

## Code Organization

### 1. Separation of Concerns

**Principle**: Each module should have a single, well-defined responsibility.

**Implementation**:
```
src/
├── client/     # Frontend logic only
├── server/     # Backend logic only
└── shared/     # Code used by both
```

**Example**:
```javascript
// ❌ Bad: Mixed concerns
function createActivity(data) {
  // Database logic
  db.insert(data);
  // UI logic
  updateUI();
  // Email logic
  sendEmail();
}

// ✅ Good: Separated concerns
// dataService.js
function createActivity(data) {
  return db.insert(data);
}

// emailService.js
function notifyActivity(activity) {
  return sendEmail(activity);
}

// UI component
async function handleSubmit(data) {
  const activity = await dataService.createActivity(data);
  await emailService.notifyActivity(activity);
  updateUI(activity);
}
```

### 2. DRY (Don't Repeat Yourself)

**Principle**: Avoid code duplication through reusable functions.

**Implementation**:
```javascript
// ❌ Bad: Repeated code
function getProjects() {
  const response = await fetch('/api/v1/projects');
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

function getActivities() {
  const response = await fetch('/api/v1/activities');
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

// ✅ Good: Reusable request function
async function request(endpoint) {
  const response = await fetch(`/api/v1${endpoint}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

const getProjects = () => request('/projects');
const getActivities = () => request('/activities');
```

### 3. Single Responsibility Principle

**Principle**: A function/class should do one thing and do it well.

**Example**:
```javascript
// ❌ Bad: Multiple responsibilities
function processActivity(activity) {
  // Validates
  if (!activity.name) throw new Error('Name required');
  // Saves
  database.save(activity);
  // Logs
  logger.info('Activity saved');
  // Notifies
  emailService.send(activity);
  // Updates UI
  renderActivity(activity);
}

// ✅ Good: Single responsibilities
function validateActivity(activity) {
  if (!activity.name) throw new Error('Name required');
  return true;
}

function saveActivity(activity) {
  return database.save(activity);
}

function logActivity(activity) {
  logger.info('Activity saved', { id: activity.id });
}

async function processActivity(activity) {
  validateActivity(activity);
  const saved = await saveActivity(activity);
  logActivity(saved);
  return saved;
}
```

## Error Handling

### 1. Try-Catch Blocks

**Always wrap async operations**:
```javascript
// ❌ Bad: No error handling
async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

// ✅ Good: Proper error handling
async function getData() {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    throw error;
  }
}
```

### 2. Custom Error Classes

**Create meaningful error types**:
```javascript
// errors.js
export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 422;
  }
}

export class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

// Usage
throw new ValidationError('Validation failed', errors);
throw new NotFoundError('Activity', activityId);
```

### 3. Centralized Error Handler

**Handle all errors in one place**:
```javascript
// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
```

## Input Validation

### 1. Schema Validation

**Use Joi for consistent validation**:
```javascript
import Joi from 'joi';

// Define schema
const activitySchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  status: Joi.string().valid('Planned', 'In Progress', 'Completed').required(),
  date: Joi.date().iso().required(),
  budget: Joi.number().min(0).default(0),
});

// Validate data
const { error, value } = activitySchema.validate(data);

if (error) {
  throw new ValidationError('Invalid data', error.details);
}
```

### 2. Sanitization

**Clean user input**:
```javascript
function sanitizeInput(input) {
  // Remove leading/trailing whitespace
  let sanitized = input.trim();
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized.replace(/[&<>"']/g, (char) => {
    const escapeChars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return escapeChars[char];
  });
  
  return sanitized;
}
```

## Logging Best Practices

### 1. Structured Logging

**Use consistent log formats**:
```javascript
// ❌ Bad: Unstructured
logger.info('User created activity');

// ✅ Good: Structured
logger.info('Activity created', {
  userId: user.id,
  activityId: activity.id,
  activityName: activity.name,
  timestamp: new Date().toISOString(),
});
```

### 2. Log Levels

**Use appropriate levels**:
```javascript
logger.error('Database connection failed', { error });  // Critical issues
logger.warn('API rate limit approaching', { count });   // Warnings
logger.info('User logged in', { userId });              // Important events
logger.http('GET /api/activities', { status: 200 });   // HTTP requests
logger.debug('Processing data', { recordCount });       // Development info
```

### 3. Contextual Information

**Include relevant context**:
```javascript
logger.info('Activity updated', {
  activityId: activity.id,
  userId: req.user.id,
  changes: Object.keys(updates),
  ip: req.ip,
  userAgent: req.get('user-agent'),
});
```

## API Design

### 1. RESTful Conventions

**Follow REST principles**:
```
GET    /api/v1/activities        # List all
GET    /api/v1/activities/:id    # Get one
POST   /api/v1/activities        # Create
PUT    /api/v1/activities/:id    # Update (full)
PATCH  /api/v1/activities/:id    # Update (partial)
DELETE /api/v1/activities/:id    # Delete
```

### 2. Consistent Response Format

**Standard response structure**:
```javascript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-01-09T12:00:00.000Z"
}

// Error
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": [ ... ],
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

### 3. HTTP Status Codes

**Use appropriate codes**:
```javascript
200 OK                  // Successful GET, PUT, PATCH
201 Created            // Successful POST
204 No Content         // Successful DELETE
400 Bad Request        // Invalid request
401 Unauthorized       // Authentication required
403 Forbidden          // Insufficient permissions
404 Not Found          // Resource doesn't exist
422 Unprocessable      // Validation failed
500 Internal Error     // Server error
```

## Testing Practices

### 1. Unit Tests

**Test individual functions**:
```javascript
describe('PaginationHelper', () => {
  it('should paginate data correctly', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ id: i }));
    const result = PaginationHelper.paginate(data, 1, 10);
    
    expect(result.data).toHaveLength(10);
    expect(result.pagination.totalPages).toBe(3);
  });
});
```

### 2. Integration Tests

**Test API endpoints**:
```javascript
describe('GET /api/v1/activities', () => {
  it('should return all activities', async () => {
    const response = await request(app)
      .get('/api/v1/activities')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### 3. Test Coverage

**Aim for high coverage**:
```javascript
// Run tests with coverage
npm run test:coverage

// Target minimum coverage
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%
```

## Code Style

### 1. Naming Conventions

**Use clear, descriptive names**:
```javascript
// ❌ Bad
const d = new Date();
const arr = [...];
function fn() { }

// ✅ Good
const currentDate = new Date();
const activities = [...];
function calculateTotalBudget() { }
```

### 2. Function Naming

**Verbs for actions, nouns for data**:
```javascript
// Functions (verbs)
function getActivity() { }
function createProject() { }
function updateIndicator() { }
function deleteCase() { }

// Variables (nouns)
const activity = { };
const projectList = [];
const indicatorData = { };
```

### 3. Comments

**Explain WHY, not WHAT**:
```javascript
// ❌ Bad: Obvious
// Increment counter
counter++;

// ❌ Bad: Redundant
// Get activities from database
const activities = await db.getActivities();

// ✅ Good: Explains why
// Use cached data to reduce database load during peak hours
const activities = cache.get('activities') || await db.getActivities();

// ✅ Good: Explains complex logic
// Filter activities completed within the last 30 days for the monthly report
// This excludes activities with null completion dates to prevent errors
const recentActivities = activities.filter(a => 
  a.completionDate && 
  isWithinDays(a.completionDate, 30)
);
```

## Security Practices

### 1. Input Validation

**Never trust user input**:
```javascript
// Validate on both client and server
// Client: Quick feedback
// Server: Security enforcement

router.post('/activities', validate(activitySchema), async (req, res) => {
  // req.body is now validated
  const activity = await dataService.createActivity(req.body);
  res.json(activity);
});
```

### 2. Environment Variables

**Never commit secrets**:
```javascript
// ❌ Bad: Hardcoded
const apiKey = 'abc123secret';

// ✅ Good: Environment variable
const apiKey = process.env.API_KEY;

// .env (not in git)
API_KEY=abc123secret
```

### 3. Security Headers

**Use Helmet.js**:
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true,
}));
```

## Performance Optimization

### 1. Pagination

**Don't return all data**:
```javascript
// ❌ Bad: Return everything
function getActivities() {
  return activities; // Could be thousands
}

// ✅ Good: Paginate
function getActivities(page = 1, limit = 10) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: activities.slice(start, end),
    pagination: {
      page,
      limit,
      total: activities.length,
      totalPages: Math.ceil(activities.length / limit),
    },
  };
}
```

### 2. Caching

**Cache expensive operations**:
```javascript
const cache = new Map();

async function getDashboardStats() {
  // Check cache first
  const cached = cache.get('dashboard-stats');
  
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }
  
  // Calculate stats (expensive)
  const stats = await calculateStats();
  
  // Cache for 1 minute
  cache.set('dashboard-stats', {
    data: stats,
    timestamp: Date.now(),
  });
  
  return stats;
}
```

### 3. Async/Await Best Practices

**Run independent operations in parallel**:
```javascript
// ❌ Bad: Sequential (slow)
const projects = await getProjects();
const activities = await getActivities();
const indicators = await getIndicators();

// ✅ Good: Parallel (fast)
const [projects, activities, indicators] = await Promise.all([
  getProjects(),
  getActivities(),
  getIndicators(),
]);
```

## Git Workflow

### 1. Commit Messages

**Use conventional commits**:
```
feat: Add activity filtering endpoint
fix: Correct pagination calculation
docs: Update API documentation
style: Format code with prettier
refactor: Simplify data service
test: Add unit tests for helpers
chore: Update dependencies
```

### 2. Branch Strategy

**Use feature branches**:
```bash
# Main branches
main          # Production-ready code
develop       # Development integration

# Feature branches
feature/add-authentication
feature/improve-dashboard
bugfix/fix-date-calculation
hotfix/critical-security-patch
```

### 3. Code Review Checklist

**Before merging**:
- [ ] All tests pass
- [ ] Code is formatted (Prettier)
- [ ] No linting errors (ESLint)
- [ ] Documentation updated
- [ ] No console.logs
- [ ] No commented code
- [ ] Environment variables not hardcoded
- [ ] Error handling implemented

## Documentation

### 1. Code Documentation

**Document public APIs**:
```javascript
/**
 * Creates a new activity in the system
 * 
 * @param {Object} activityData - The activity data
 * @param {string} activityData.name - Activity name
 * @param {string} activityData.status - Activity status
 * @param {Date} activityData.date - Activity date
 * @returns {Promise<Object>} The created activity
 * @throws {ValidationError} If data is invalid
 * @throws {Error} If creation fails
 * 
 * @example
 * const activity = await createActivity({
 *   name: 'Community Training',
 *   status: 'Planned',
 *   date: new Date('2026-02-01')
 * });
 */
async function createActivity(activityData) {
  // Implementation
}
```

### 2. README Documentation

**Keep README current**:
```markdown
# Project Name

## Installation
## Usage
## API Documentation
## Contributing
## License
```

### 3. Inline Comments

**Comment complex logic**:
```javascript
// Calculate burn rate as a percentage of budget used
// Formula: (expenditure / budget) * 100
// Edge case: Return 0 if budget is 0 to avoid division by zero
const burnRate = budget > 0 ? (expenditure / budget) * 100 : 0;
```

---

**Remember**: Good code is:
- ✅ **Readable** - Easy to understand
- ✅ **Maintainable** - Easy to modify
- ✅ **Testable** - Easy to verify
- ✅ **Scalable** - Easy to grow
- ✅ **Secure** - Hard to exploit
- ✅ **Performant** - Fast and efficient

**Follow these practices consistently!**
