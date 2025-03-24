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
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    temperature: 0.7,
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
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    temperature: 0.7,
  },
};

/**
 * Load API configuration from environment variables
 * @returns The API configuration
 */
export function loadApiConfig(): ApiConfig {
  return {
    port: getNumberEnv('PORT', DEFAULT_API_CONFIG.port),
    environment: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    dynamoDb: {
      region: getEnv('DYNAMODB_REGION', DEFAULT_API_CONFIG.dynamoDb?.region || 'us-east-1'),
      endpoint: process.env['DYNAMODB_ENDPOINT'],
      tablePrefix: getEnv('DYNAMODB_TABLE_PREFIX', DEFAULT_API_CONFIG.dynamoDb?.tablePrefix || 'cody-batch-'),
    },
    github: {
      token: getEnv('GITHUB_TOKEN', DEFAULT_API_CONFIG.github?.token || ''),
      allowedRepositories: getEnv('GITHUB_ALLOWED_REPOSITORIES', 'liamzdenek/*').split(','),
      baseUrl: process.env['GITHUB_API_URL'],
    },
    claude: {
      apiKey: getEnv('CLAUDE_API_KEY', DEFAULT_API_CONFIG.claude?.apiKey || ''),
      model: getEnv('CLAUDE_MODEL', DEFAULT_API_CONFIG.claude?.model || 'claude-3-opus-20240229'),
      maxTokens: getNumberEnv('CLAUDE_MAX_TOKENS', DEFAULT_API_CONFIG.claude?.maxTokens || 4000),
      temperature: getNumberEnv('CLAUDE_TEMPERATURE', DEFAULT_API_CONFIG.claude?.temperature || 0.7),
    },
  };
}

/**
 * Load batch configuration from environment variables
 * @returns The batch configuration
 */
export function loadBatchConfig(): BatchConfig {
  return {
    jobQueue: getEnv('BATCH_JOB_QUEUE', DEFAULT_BATCH_CONFIG.jobQueue || 'cody-batch-job-queue'),
    jobDefinition: getEnv('BATCH_JOB_DEFINITION', DEFAULT_BATCH_CONFIG.jobDefinition || 'cody-batch-job-definition'),
    region: getEnv('AWS_REGION', DEFAULT_BATCH_CONFIG.region || 'us-east-1'),
    dynamoDb: {
      region: getEnv('DYNAMODB_REGION', DEFAULT_BATCH_CONFIG.dynamoDb?.region || 'us-east-1'),
      endpoint: process.env['DYNAMODB_ENDPOINT'],
      tablePrefix: getEnv('DYNAMODB_TABLE_PREFIX', DEFAULT_BATCH_CONFIG.dynamoDb?.tablePrefix || 'cody-batch-'),
    },
    github: {
      token: getEnv('GITHUB_TOKEN', DEFAULT_BATCH_CONFIG.github?.token || ''),
      allowedRepositories: getEnv('GITHUB_ALLOWED_REPOSITORIES', 'liamzdenek/*').split(','),
      baseUrl: process.env['GITHUB_API_URL'],
    },
    claude: {
      apiKey: getEnv('CLAUDE_API_KEY', DEFAULT_BATCH_CONFIG.claude?.apiKey || ''),
      model: getEnv('CLAUDE_MODEL', DEFAULT_BATCH_CONFIG.claude?.model || 'claude-3-opus-20240229'),
      maxTokens: getNumberEnv('CLAUDE_MAX_TOKENS', DEFAULT_BATCH_CONFIG.claude?.maxTokens || 4000),
      temperature: getNumberEnv('CLAUDE_TEMPERATURE', DEFAULT_BATCH_CONFIG.claude?.temperature || 0.7),
    },
  };
}

/**
 * Get the table name with the prefix
 * @param config The batch configuration
 * @param tableName The table name
 * @returns The table name with the prefix
 */
export function getTableName(config: BatchConfig, tableName: string): string {
  return `${config.dynamoDb?.tablePrefix || 'cody-batch-'}${tableName}`;
}