import Joi from 'joi';

/**
 * Validation schemas for API requests
 */

// Activity validation schema
export const activitySchema = Joi.object({
  thematicAreaId: Joi.string().required(),
  indicatorId: Joi.string().required(),
  projectId: Joi.string().required(),
  activityName: Joi.string().min(3).max(500).required(),
  description: Joi.string().max(2000).allow(''),
  plannedDate: Joi.date().iso().required(),
  completionDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('Planned', 'In Progress', 'Completed', 'Cancelled', 'Delayed').required(),
  location: Joi.string().required(),
  beneficiaries: Joi.object({
    direct: Joi.object({
      male: Joi.number().integer().min(0).default(0),
      female: Joi.number().integer().min(0).default(0),
      other: Joi.number().integer().min(0).default(0),
    }),
    indirect: Joi.object({
      male: Joi.number().integer().min(0).default(0),
      female: Joi.number().integer().min(0).default(0),
      other: Joi.number().integer().min(0).default(0),
    }),
  }).required(),
  budget: Joi.number().min(0).default(0),
  actualCost: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).allow(''),
});

// Project validation schema
export const projectSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  donor: Joi.string().min(2).max(100).required(),
  thematicAreaId: Joi.string().required(),
  status: Joi.string().valid('Active', 'Completed', 'On Hold', 'Cancelled').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  budget: Joi.number().min(0).required(),
  expenditure: Joi.number().min(0).default(0),
  locations: Joi.array().items(Joi.string()).min(1).required(),
});

// Indicator validation schema
export const indicatorSchema = Joi.object({
  code: Joi.string().min(2).max(50).required(),
  name: Joi.string().min(3).max(500).required(),
  description: Joi.string().max(2000).allow(''),
  type: Joi.string().valid('Output', 'Outcome', 'Impact').required(),
  thematicAreaId: Joi.string().required(),
  target: Joi.number().integer().min(0).required(),
  baseline: Joi.number().integer().min(0).default(0),
  unit: Joi.string().max(50).required(),
  reportingFrequency: Joi.string().valid('Monthly', 'Quarterly', 'Annually').required(),
});

// Case Management validation schema
export const caseSchema = Joi.object({
  caseNumber: Joi.string().min(3).max(50).required(),
  projectId: Joi.string().required(),
  dateReported: Joi.date().iso().required(),
  caseType: Joi.string().min(2).max(100).required(),
  severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
  status: Joi.string().valid('Open', 'In Progress', 'Closed', 'Referred').required(),
  location: Joi.string().required(),
  ageGroup: Joi.string().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  serviceProvided: Joi.string().max(500).allow(''),
  referrals: Joi.string().max(500).allow(''),
  followUpDate: Joi.date().iso().allow(null),
  closureDate: Joi.date().iso().allow(null),
  notes: Joi.string().max(1000).allow(''),
});

// Query parameter validation
export const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().max(100),
  status: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  projectId: Joi.string(),
  thematicAreaId: Joi.string(),
  location: Joi.string(),
});

/**
 * Validates request body against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi validation schema
 * @returns {Object} - Validated data
 * @throws {Error} - Validation error
 */
export const validateData = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  return value;
};

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 422;
  }
}

export default {
  activitySchema,
  projectSchema,
  indicatorSchema,
  caseSchema,
  querySchema,
  validateData,
  ValidationError,
};
