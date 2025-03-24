import { BatchConfig } from 'shared';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Get batch configuration from environment variables
 * @returns Batch configuration
 */
export function getConfig(): BatchConfig {
  return {
    jobQueue: process.env.JOB_QUEUE || '',
    jobDefinition: process.env.JOB_DEFINITION || '',
    region: process.env.AWS_REGION || 'us-east-1',
    dynamoDb: {
      region: process.env.DYNAMODB_REGION || process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT,
      tablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'cody-batch',
    },
    github: {
      token: process.env.GITHUB_TOKEN || '',
      allowedRepositories: (process.env.ALLOWED_REPOSITORIES || 'liamzdenek/*').split(','),
      tempDir: process.env.TEMP_DIR,
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      model: process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '64000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.5'),
    },
  };
}

/**
 * Validate batch configuration
 * @param config Batch configuration
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: BatchConfig): void {
  if (!config.github.token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  if (!config.claude.apiKey) {
    throw new Error('CLAUDE_API_KEY environment variable is required');
  }

  if (!config.dynamoDb.tablePrefix) {
    throw new Error('DYNAMODB_TABLE_PREFIX environment variable is required');
  }
}

/**
 * Get DynamoDB table name
 * @param tableName Base table name
 * @param config Batch configuration
 * @returns Full table name with prefix
 */
export function getTableName(tableName: string, config: BatchConfig): string {
  // Check if environment variables for table names are set
  if (tableName === 'jobs' && process.env.DYNAMODB_JOBS_TABLE) {
    console.log(`Using jobs table name from environment: ${process.env.DYNAMODB_JOBS_TABLE}`);
    return process.env.DYNAMODB_JOBS_TABLE;
  }
  
  if (tableName === 'repositories' && process.env.DYNAMODB_REPOSITORIES_TABLE) {
    console.log(`Using repositories table name from environment: ${process.env.DYNAMODB_REPOSITORIES_TABLE}`);
    return process.env.DYNAMODB_REPOSITORIES_TABLE;
  }
  
  // Fall back to constructing the table name from the prefix
  const constructedName = `${config.dynamoDb.tablePrefix}-${tableName}`;
  console.log(`Constructed table name: ${constructedName}`);
  return constructedName;
}