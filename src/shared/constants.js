// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Response Messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
};

// Activity Status
export const ACTIVITY_STATUS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DELAYED: 'Delayed',
};

// Project Status
export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

// Indicator Types
export const INDICATOR_TYPES = {
  OUTPUT: 'Output',
  OUTCOME: 'Outcome',
  IMPACT: 'Impact',
};

// Beneficiary Categories
export const BENEFICIARY_CATEGORIES = {
  DIRECT: 'Direct',
  INDIRECT: 'Indirect',
};

// Gender Categories
export const GENDER_CATEGORIES = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

// Age Groups
export const AGE_GROUPS = {
  CHILDREN: 'Children (0-17)',
  YOUTH: 'Youth (18-24)',
  ADULTS: 'Adults (25-59)',
  ELDERLY: 'Elderly (60+)',
};

// Locations
export const LOCATIONS = [
  'Nakivale',
  'Kampala',
  'Nyakabande',
  'Adjumani',
  'Bidibidi',
  'Kyaka II',
  'Rhino Camp',
  'Palabek',
];

// Date Formats
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy',
  MONTH_YEAR: 'MMM yyyy',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// File Export
export const EXPORT_FORMATS = {
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf',
  JSON: 'json',
};

export default {
  HTTP_STATUS,
  MESSAGES,
  ACTIVITY_STATUS,
  PROJECT_STATUS,
  INDICATOR_TYPES,
  BENEFICIARY_CATEGORIES,
  GENDER_CATEGORIES,
  AGE_GROUPS,
  LOCATIONS,
  DATE_FORMATS,
  PAGINATION,
  EXPORT_FORMATS,
};
