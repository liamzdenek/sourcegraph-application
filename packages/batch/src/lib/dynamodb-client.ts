import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { BatchConfig, Job, JobStatus, Repository } from 'shared';
import { getTableName } from './config';

/**
 * DynamoDB client for interacting with the DynamoDB tables
 */
export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private config: BatchConfig;
  private jobsTable: string;
  private repositoriesTable: string;

  /**
   * Create a new DynamoDB client
   * @param config Batch configuration
   */
  constructor(config: BatchConfig) {
    this.config = config;
    
    // Create DynamoDB client
    const dynamoClient = new DynamoDBClient({
      region: config.dynamoDb.region,
      endpoint: config.dynamoDb.endpoint,
    });
    
    // Create DynamoDB document client
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    
    // Get table names
    this.jobsTable = getTableName('jobs', config);
    this.repositoriesTable = getTableName('repositories', config);
  }

  /**
   * Get a job by ID
   * @param jobId Job ID
   * @returns Job or null if not found
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.jobsTable,
          Key: { jobId },
        })
      );

      return result.Item as Job || null;
    } catch (error) {
      console.error(`Error getting job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Update job status
   * @param jobId Job ID
   * @param status New job status
   * @param additionalData Additional data to update
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Build update expression
      let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status',
      };
      const expressionAttributeValues: Record<string, any> = {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      };

      // Add additional data to update expression
      Object.entries(additionalData).forEach(([key, value], index) => {
        updateExpression += `, #attr${index} = :val${index}`;
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = value;
      });

      // Update job
      await this.client.send(
        new UpdateCommand({
          TableName: this.jobsTable,
          Key: { jobId },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );
    } catch (error) {
      console.error(`Error updating job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get repositories for a job
   * @param jobId Job ID
   * @returns List of repositories
   */
  async getRepositoriesForJob(jobId: string): Promise<Repository[]> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.repositoriesTable,
          KeyConditionExpression: 'jobId = :jobId',
          ExpressionAttributeValues: {
            ':jobId': jobId,
          },
        })
      );

      return (result.Items || []) as Repository[];
    } catch (error) {
      console.error(`Error getting repositories for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Update repository status
   * @param jobId Job ID
   * @param repositoryName Repository name
   * @param status Repository status
   * @param additionalData Additional data to update
   */
  async updateRepositoryStatus(
    jobId: string,
    repositoryName: string,
    status: JobStatus,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Build update expression
      let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status',
      };
      const expressionAttributeValues: Record<string, any> = {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      };

      // Add additional data to update expression
      Object.entries(additionalData).forEach(([key, value], index) => {
        updateExpression += `, #attr${index} = :val${index}`;
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = value;
      });

      // Update repository
      await this.client.send(
        new UpdateCommand({
          TableName: this.repositoriesTable,
          Key: { jobId, repositoryName },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );
    } catch (error) {
      console.error(
        `Error updating repository status for ${repositoryName} in job ${jobId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Store Claude conversation
   * @param jobId Job ID
   * @param repositoryName Repository name
   * @param conversation Claude conversation
   * @param tokenUsage Token usage
   */
  async storeClaudeConversation(
    jobId: string,
    repositoryName: string,
    conversation: any,
    tokenUsage: {
      input: number;
      output: number;
      cacheCreation: number;
      cacheRead: number;
      total: number;
    }
  ): Promise<void> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.repositoriesTable,
          Key: { jobId, repositoryName },
          UpdateExpression:
            'SET claudeConversation = :conversation, tokenUsage = :tokenUsage, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':conversation': conversation,
            ':tokenUsage': tokenUsage,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );
    } catch (error) {
      console.error(
        `Error storing Claude conversation for ${repositoryName} in job ${jobId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Store repository diff
   * @param jobId Job ID
   * @param repositoryName Repository name
   * @param diff Repository diff
   * @param pullRequestUrl Pull request URL
   */
  async storeRepositoryDiff(
    jobId: string,
    repositoryName: string,
    diff: string,
    pullRequestUrl?: string
  ): Promise<void> {
    try {
      const updateExpression = pullRequestUrl
        ? 'SET diff = :diff, pullRequestUrl = :pullRequestUrl, updatedAt = :updatedAt'
        : 'SET diff = :diff, updatedAt = :updatedAt';

      const expressionAttributeValues: Record<string, any> = {
        ':diff': diff,
        ':updatedAt': new Date().toISOString(),
      };

      if (pullRequestUrl) {
        expressionAttributeValues[':pullRequestUrl'] = pullRequestUrl;
      }

      await this.client.send(
        new UpdateCommand({
          TableName: this.repositoriesTable,
          Key: { jobId, repositoryName },
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );
    } catch (error) {
      console.error(
        `Error storing repository diff for ${repositoryName} in job ${jobId}:`,
        error
      );
      throw error;
    }
  }
}