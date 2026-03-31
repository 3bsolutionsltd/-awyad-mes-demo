import express from 'express';
import activitiesRouter from './activities.js';
import projectsRouter from './projects.js';
import indicatorsRouter from './indicators.js';
import casesRouter from './casesNew.js';
import dashboardRouter from './dashboard.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import auditLogsRouter from './auditLogs.js';
import permissionsRouter from './permissions.js';
import sessionsRouter from './sessions.js';
import thematicAreasRouter from './thematicAreas.js';
import strategiesRouter from './strategies.js';
import pillarsRouter from './pillars.js';
import componentsRouter from './components.js';
import configurationsRouter from './configurations.js';
import monthlyTrackingRouter from './monthlyTracking.js';
import nonProgramActivitiesRouter from './nonProgramActivities.js';
import evidenceRouter from './evidence.js';
import exportsRouter from './exports.js';
import integrationsRouter from './integrations.js';
import rbmRouter from './rbm.js';
import donorsRouter from './donors.js';
import supportDataRouter from './supportData.js';
import databaseService from '../services/databaseService.js';

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  const useDatabase = process.env.USE_DATABASE === 'true';
  
  let dbHealth = 'not configured';
  if (useDatabase) {
    dbHealth = await databaseService.healthCheck() ? 'healthy' : 'unhealthy';
  }
  
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: {
      enabled: useDatabase,
      status: dbHealth,
    },
  });
});

// Mount route modules
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/permissions', permissionsRouter);
router.use('/sessions', sessionsRouter);
router.use('/strategies', strategiesRouter);
router.use('/pillars', pillarsRouter);
router.use('/components', componentsRouter);
router.use('/configurations', configurationsRouter);
router.use('/monthly-tracking', monthlyTrackingRouter);
router.use('/non-program-activities', nonProgramActivitiesRouter);
router.use('/activities', activitiesRouter);
router.use('/projects', projectsRouter);
router.use('/donors', donorsRouter);
router.use('/support-data', supportDataRouter);
router.use('/indicators', indicatorsRouter);
router.use('/cases', casesRouter);
router.use('/thematic-areas', thematicAreasRouter);
router.use('/dashboard', dashboardRouter);
router.use('/evidence', evidenceRouter);
router.use('/exports', exportsRouter);
router.use('/integrations', integrationsRouter);
router.use('/rbm', rbmRouter);

export default router;
