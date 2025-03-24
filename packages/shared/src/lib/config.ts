import { getEnv, getNumberEnv, getBooleanEnv } from './utils';
import { ApiConfig, BatchConfig } from './types';

/**
 * Default API configuration
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  port: 3000,
  environment: 'development',
  dynamoDb: {
    region: 'us-east-1',
    tablePrefix: 'cody-batch-',
  },
  github: {
    token: '',
    allowedRepositories: ['liamzdenek/*'],
  },
  claude: {
    apiKey: '',
    model: 'claude-3-7-sonnet-20240229',
    maxTokens: 100000,
    temperature: 0.5,
  },
};

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  jobQueue: 'cody-batch-job-queue',
  jobDefinition: 'cody-batch-job-definition',
  region: 'us-east-1',
  dynamoDb: {
    region: 'us-east-1',
    tablePrefix: 'cody-batch-',
  },
  github: {
    token: '',
    allowedRepositories: ['liamzdenek/*'],
  },
  claude: {
    apiKey: '',
    model: 'claude-3-7-sonnet-20240229',
    maxTokens: 100000,
    temperature: 0.5,
  },
};

/**
 * DynamoDB table names
 */
export const DYNAMODB_TABLES = {
  JOBS: 'jobs',
  REPOSITORIES: 'repositories',
  REPOSITORY_RESULTS: 'repository-results',
  CLAUDE_THREADS: 'claude-threads',
};

/**
 * Load API configuration from environment variables
 * @returns API configuration
 */
export function loadApiConfig(): ApiConfig {
  return {
    port: getNumberEnv('PORT', DEFAULT_API_CONFIG.port),
    environment: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    dynamoDb: {
      region: getEnv('DYNAMODB_REGION', DEFAULT_API_CONFIG.dynamoDb.region),
      endpoint: process.env['DYNAMODB_ENDPOINT'],
      tablePrefix: getEnv('DYNAMODB_TABLE_PREFIX', DEFAULT_API_CONFIG.dynamoDb.tablePrefix),
    },
    github: {
      token: getEnv('GITHUB_TOKEN', DEFAULT_API_CONFIG.github.token),
      allowedRepositories: getEnv('GITHUB_ALLOWED_REPOSITORIES', 'liamzdenek/*').split(','),
      baseUrl: process.env['GITHUB_API_URL'],
    },
    claude: {
      apiKey: getEnv('CLAUDE_API_KEY', DEFAULT_API_CONFIG.claude.apiKey),
      model: getEnv('CLAUDE_MODEL', DEFAULT_API_CONFIG.claude.model),
      maxTokens: getNumberEnv('CLAUDE_MAX_TOKENS', DEFAULT_API_CONFIG.claude.maxTokens),
      temperature: getNumberEnv('CLAUDE_TEMPERATURE', DEFAULT_API_CONFIG.claude.temperature),
    },
  };
}

/**
 * Load batch configuration from environment variables
 * @returns Batch configuration
 */
export function loadBatchConfig(): BatchConfig {
  return {
    jobQueue: getEnv('BATCH_JOB_QUEUE', DEFAULT_BATCH_CONFIG.jobQueue),
    jobDefinition: getEnv('BATCH_JOB_DEFINITION', DEFAULT_BATCH_CONFIG.jobDefinition),
    region: getEnv('AWS_REGION', DEFAULT_BATCH_CONFIG.region),
    dynamoDb: {
      region: getEnv('DYNAMODB_REGION', DEFAULT_BATCH_CONFIG.dynamoDb.region),
      endpoint: process.env['DYNAMODB_ENDPOINT'],
      tablePrefix: getEnv('DYNAMODB_TABLE_PREFIX', DEFAULT_BATCH_CONFIG.dynamoDb.tablePrefix),
    },
    github: {
      token: getEnv('GITHUB_TOKEN', DEFAULT_BATCH_CONFIG.github.token),
      allowedRepositories: getEnv('GITHUB_ALLOWED_REPOSITORIES', 'liamzdenek/*').split(','),
      baseUrl: process.env['GITHUB_API_URL'],
    },
    claude: {
      apiKey: getEnv('CLAUDE_API_KEY', DEFAULT_BATCH_CONFIG.claude.apiKey),
      model: getEnv('CLAUDE_MODEL', DEFAULT_BATCH_CONFIG.claude.model),
      maxTokens: getNumberEnv('CLAUDE_MAX_TOKENS', DEFAULT_BATCH_CONFIG.claude.maxTokens),
      temperature: getNumberEnv('CLAUDE_TEMPERATURE', DEFAULT_BATCH_CONFIG.claude.temperature),
    },
  };
}

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',
  REPOSITORIES: '/repositories',
  JOBS: '/jobs',
};

/**
 * Error codes
 */
export const ERROR_CODES = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  CLAUDE_API_ERROR: 'CLAUDE_API_ERROR',
  DYNAMODB_ERROR: 'DYNAMODB_ERROR',
  BATCH_ERROR: 'BATCH_ERROR',
};

/**
 * Maximum number of repositories per job
 */
export const MAX_REPOSITORIES_PER_JOB = 5;

/**
 * Maximum number of retries for API calls
 */
export const MAX_API_RETRIES = 3;

/**
 * Initial delay for retry backoff (in milliseconds)
 */
export const INITIAL_RETRY_DELAY = 1000;