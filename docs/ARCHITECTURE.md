# System Architecture Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    State     │  │   Components │      │
│  │   (HTML/CSS) │◄─┤   Manager    │◄─┤   (Render)   │      │
│  └──────┬───────┘  └──────▲───────┘  └──────────────┘      │
│         │                 │                                   │
│         │          ┌──────┴───────┐                          │
│         └──────────┤ API Service  │                          │
│                    └──────┬───────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/JSON
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    SERVER TIER                                │
│                    ┌──────┴───────┐                          │
│                    │  Express.js  │                          │
│                    │   Middleware │                          │
│                    └──────┬───────┘                          │
│                           │                                   │
│  ┌──────────┬─────────────┼─────────────┬──────────┐        │
│  │          │             │             │          │        │
│  ▼          ▼             ▼             ▼          ▼        │
│ ┌────┐  ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────┐    │
│ │Auth│  │ Rate   │  │ Request  │  │ Error  │  │ CORS │    │
│ │    │  │ Limit  │  │ Logger   │  │Handler │  │      │    │
│ └────┘  └────────┘  └──────────┘  └────────┘  └──────┘    │
│                           │                                   │
│                    ┌──────┴───────┐                          │
│                    │    Routes    │                          │
│                    │   (API v1)   │                          │
│                    └──────┬───────┘                          │
│                           │                                   │
│  ┌────────────────────────┼────────────────────────┐        │
│  │                        │                        │        │
│  ▼                        ▼                        ▼        │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│ │  Activities  │  │   Projects   │  │  Dashboard   │      │
│ │   Routes     │  │    Routes    │  │   Routes     │      │
│ └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│        │                  │                  │              │
│        └──────────────────┼──────────────────┘              │
│                           │                                   │
│                    ┌──────┴───────┐                          │
│                    │ Data Service │                          │
│                    │  (Business)  │                          │
│                    └──────┬───────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    DATA TIER                                  │
│                    ┌──────┴───────┐                          │
│                    │  In-Memory   │                          │
│                    │  Data Store  │                          │
│                    │  (JSON File) │                          │
│                    └──────────────┘                          │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │Projects │      │Activities│      │ Cases   │          │
│    │ Data    │      │  Data    │      │  Data   │          │
│    └─────────┘      └─────────┘      └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **HTML5**: Structure and markup
- **CSS3/Bootstrap 5**: Styling and responsive design
- **Vanilla JavaScript (ES6+)**: Client-side logic
- **Fetch API**: HTTP requests

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **ES6 Modules**: Modern JavaScript modules

### Data Layer
- **JSON File Storage**: Current implementation
- **CSV Support**: Import/export capability
- **Future**: PostgreSQL/MongoDB migration ready

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Nodemon**: Development auto-reload
- **Winston**: Logging

### Security & Middleware
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting
- **Compression**: Response compression
- **Joi**: Input validation

## Directory Structure

```
awyad-mes-demo/
│
├── src/                          # Source code
│   ├── client/                   # Frontend code
│   │   ├── components/           # UI components
│   │   ├── services/             # API service, state manager
│   │   └── utils/                # Client utilities
│   │
│   ├── server/                   # Backend code
│   │   ├── routes/               # API endpoints
│   │   │   ├── index.js          # Route aggregator
│   │   │   ├── activities.js     # Activity routes
│   │   │   ├── projects.js       # Project routes
│   │   │   └── dashboard.js      # Dashboard routes
│   │   │
│   │   ├── services/             # Business logic
│   │   │   └── dataService.js    # Data access layer
│   │   │
│   │   ├── middleware/           # Express middleware
│   │   │   ├── errorHandler.js   # Error handling
│   │   │   ├── requestLogger.js  # Request logging
│   │   │   └── validation.js     # Input validation
│   │   │
│   │   ├── utils/                # Server utilities
│   │   │   ├── logger.js         # Winston logger
│   │   │   └── helpers.js        # Helper functions
│   │   │
│   │   └── index.js              # Server entry point
│   │
│   └── shared/                   # Shared code
│       ├── constants.js          # Application constants
│       └── validators.js         # Validation schemas
│
├── public/                       # Static files
│   ├── index.html                # Main HTML file
│   └── assets/                   # CSS, images, etc.
│
├── data/                         # Data files
│   ├── mockData.js               # Initial data
│   └── data.json                 # Runtime data
│
├── tests/                        # Test files
│   └── helpers.test.js           # Unit tests
│
├── logs/                         # Application logs
│   ├── combined.log              # All logs
│   └── error.log                 # Error logs only
│
├── config/                       # Configuration
│
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .eslintrc.cjs                 # ESLint config
├── .prettierrc.json              # Prettier config
├── .gitignore                    # Git ignore rules
├── jest.config.js                # Jest config
├── package.json                  # Dependencies
├── README_NEW.md                 # Documentation
├── QUICKSTART.md                 # Quick start guide
├── MIGRATION_GUIDE.md            # Migration instructions
└── ARCHITECTURE.md               # This file
```

## Data Flow

### 1. Page Load
```
Browser → index.html → app.js → API Service → State Manager → Render
```

### 2. API Request
```
Client → API Service → Express → Middleware → Route Handler
     → Data Service → JSON File → Response
```

### 3. Data Modification
```
User Input → Form Validation → API Request → Server Validation
     → Data Service → Update JSON → Response → State Update → UI Refresh
```

## Key Design Patterns

### 1. **MVC Pattern**
- **Model**: Data Service (data logic)
- **View**: HTML + Render functions (presentation)
- **Controller**: Route handlers (business logic)

### 2. **Service Layer Pattern**
- Separates business logic from routes
- Reusable across different endpoints
- Easier to test and maintain

### 3. **Middleware Pattern**
- Request processing pipeline
- Cross-cutting concerns (logging, validation, errors)
- Modular and composable

### 4. **Observer Pattern**
- State Manager notifies subscribers
- Reactive UI updates
- Decoupled components

### 5. **Singleton Pattern**
- Data Service instance
- API Service instance
- State Manager instance

## API Design

### RESTful Principles
- **Resource-based URLs**: `/api/v1/activities`
- **HTTP methods**: GET, POST, PUT, DELETE
- **Status codes**: 200, 201, 400, 404, 500
- **JSON responses**: Consistent format

### Request/Response Flow
```
1. Client makes request
2. Rate limiter checks
3. Request logger logs
4. CORS validation
5. Body parsing
6. Route matching
7. Input validation
8. Business logic
9. Data operation
10. Response formatting
11. Error handling (if needed)
12. Response sent
```

## Security Measures

### Current Implementation
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation (Joi)
- ✅ Error handling
- ✅ Request logging

### Future Enhancements
- [ ] Authentication (JWT/OAuth)
- [ ] Authorization (RBAC)
- [ ] HTTPS enforcement
- [ ] SQL injection prevention (when using DB)
- [ ] XSS protection enhancements
- [ ] CSRF tokens
- [ ] API key authentication

## Scalability Considerations

### Current State (Single Server)
```
Load Balancer (Future)
         │
    ┌────┴────┐
    │ Express │
    │ Server  │
    └────┬────┘
         │
    JSON File
```

### Future State (Distributed)
```
Load Balancer
    │
    ├─────┬─────┬─────┐
    │     │     │     │
  Server Server Server Server
    │     │     │     │
    └─────┴─────┴─────┘
           │
      ┌────┴────┐
      │Database │
      │(Primary)│
      └────┬────┘
           │
    ┌──────┴──────┐
    │  Replicas   │
    └─────────────┘
```

### Scaling Strategies
1. **Horizontal Scaling**: Add more server instances
2. **Database**: Move to PostgreSQL/MongoDB
3. **Caching**: Add Redis for frequently accessed data
4. **CDN**: Serve static files from CDN
5. **Queue**: Add message queue for async tasks
6. **Microservices**: Split into smaller services

## Performance Optimization

### Current Optimizations
- Response compression
- JSON file caching
- Efficient data filtering
- Pagination support

### Future Optimizations
- Database indexing
- Query optimization
- Caching layer (Redis)
- Asset minification
- Lazy loading
- Code splitting

## Testing Strategy

### Unit Tests
- Individual functions
- Utility helpers
- Validators

### Integration Tests
- API endpoints
- Data service operations
- Middleware functions

### End-to-End Tests
- Complete user flows
- UI interactions
- Data persistence

## Monitoring & Logging

### Current Logging
- Request/response logging
- Error logging
- File-based logs (Winston)

### Future Monitoring
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics
- Health checks
- Metrics dashboard

## Deployment Architecture

### Development
```
Local Machine
  └── Node.js + Express
      └── JSON File
```

### Production (Recommended)
```
Cloud Provider (AWS/Azure/GCP)
  ├── Load Balancer
  ├── Application Servers (2+)
  ├── Database (PostgreSQL/MongoDB)
  ├── Cache (Redis)
  ├── File Storage (S3/Blob)
  └── Monitoring & Logs
```

## Migration Path

### Phase 1: Current (Complete)
- ✅ Express server
- ✅ RESTful API
- ✅ In-memory data
- ✅ JSON persistence

### Phase 2: Database (Recommended Next)
- [ ] PostgreSQL setup
- [ ] Database schema
- [ ] Migrations
- [ ] ORM integration (Sequelize/Prisma)

### Phase 3: Authentication
- [ ] User management
- [ ] JWT tokens
- [ ] Role-based access

### Phase 4: Advanced Features
- [ ] Real-time updates (WebSockets)
- [ ] File uploads
- [ ] Advanced reporting
- [ ] Data visualization

## Best Practices Implemented

### Code Quality
- ✅ ESLint for code linting
- ✅ Prettier for formatting
- ✅ Consistent naming conventions
- ✅ Modular architecture

### Security
- ✅ Input validation
- ✅ Error handling
- ✅ Security headers
- ✅ Rate limiting

### Documentation
- ✅ Inline code comments
- ✅ API documentation
- ✅ Setup guides
- ✅ Architecture docs

### Maintainability
- ✅ Separation of concerns
- ✅ DRY principle
- ✅ Single responsibility
- ✅ Dependency injection

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
