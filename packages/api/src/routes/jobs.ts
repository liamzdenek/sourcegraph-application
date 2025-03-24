import express, { Request, Response } from 'express';
import { z } from 'zod';
import { SubmitJobCommand } from '@aws-sdk/client-batch';
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { dynamoDbDocClient, batchClient } from '../lib/aws-clients';

const router = express.Router();

// Validation schemas
const createJobSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.string().min(1).max(50),
  prompt: z.string().min(10).max(5000),
  repositories: z.array(z.string()).min(1).max(5),
  createPullRequests: z.boolean().default(false)
});

const listJobsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
  status: z.string().optional()
});

const claudeThreadQuerySchema = z.object({
  view: z.enum(['standard', 'technical', 'simplified']).default('standard'),
  includeTool: z.coerce.boolean().default(true)
});

/**
 * @route POST /jobs
 * @desc Create a new job
 * @access Public
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const jobData = createJobSchema.parse(req.body);
    
    // Generate a unique job ID
    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create job record
    const job = {
      jobId,
      ...jobData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Get table name from environment variables
    const jobsTable = process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs';
    const reposTable = process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories';
    
    // Store job in DynamoDB
    await dynamoDbDocClient.send(new PutCommand({
      TableName: jobsTable,
      Item: job
    }));
    
    // Create repository records
    for (const repositoryName of jobData.repositories) {
      await dynamoDbDocClient.send(new PutCommand({
        TableName: reposTable,
        Item: {
          jobId,
          repositoryName,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
    }
    
    // Submit job to AWS Batch
    await submitBatchJob(batchClient, jobId);
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid job data',
          details: error.errors
        }
      });
    }
    
    res.status(500).json({
      error: {
        message: 'Failed to create job',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /jobs
 * @desc List all jobs
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { page, perPage, status } = listJobsSchema.parse(req.query);
    
    // Get table name from environment variables
    const jobsTable = process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs';
    
    let jobs = [];
    if (status) {
      // Query jobs by status using GSI
      const result = await dynamoDbDocClient.send(new QueryCommand({
        TableName: jobsTable,
        IndexName: 'status-createdAt-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        ScanIndexForward: false // Sort by createdAt in descending order
      }));
      
      jobs = result.Items || [];
    } else {
      // Scan all jobs (in production, we would use pagination tokens)
      const result = await dynamoDbDocClient.send(new ScanCommand({
        TableName: jobsTable,
        Limit: 100 // Limit to 100 jobs for performance
      }));
      
      jobs = result.Items || [];
      jobs = result.Items || [];
      
      // Sort by createdAt in descending order
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Transform jobs to match API response format
    const transformedJobs = jobs.map(job => ({
      jobId: job.jobId,
      name: job.name,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      repositoryCount: job.repositories.length,
      completedCount: job.repositories.filter((repo: any) => 
        repo.status === 'completed' || repo.status === 'failed'
      ).length
    }));
    
    // Paginate results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedJobs = transformedJobs.slice(startIndex, endIndex);
    
    res.json({
      jobs: paginatedJobs,
      pagination: {
        page,
        perPage,
        total: transformedJobs.length,
        totalPages: Math.ceil(transformedJobs.length / perPage)
      }
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid query parameters',
          details: error.errors
        }
      });
    }
    
    res.status(500).json({
      error: {
        message: 'Failed to list jobs',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /jobs/:jobId
 * @desc Get job details
 * @access Public
 */
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Get table names from environment variables
    const jobsTable = process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs';
    const reposTable = process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories';
    
    // Get job from DynamoDB
    const jobResult = await dynamoDbDocClient.send(new GetCommand({
      TableName: jobsTable,
      Key: { jobId }
    }));
    
    if (!jobResult.Item) {
      return res.status(404).json({
        error: {
          message: 'Job not found'
        }
      });
    }
    
    const job = jobResult.Item;
    
    // Get repositories for job
    const reposResult = await dynamoDbDocClient.send(new QueryCommand({
      TableName: reposTable,
      KeyConditionExpression: 'jobId = :jobId',
      ExpressionAttributeValues: {
        ':jobId': jobId
      }
    }));
    
    const repositories = (reposResult.Items || []).map(repo => ({
      name: repo.repositoryName,
      status: repo.status,
      pullRequestUrl: repo.pullRequestUrl || null,
      wereChangesNecessary: repo.wereChangesNecessary !== undefined ? repo.wereChangesNecessary : null,
      completedAt: repo.completedAt || null
    }));
    
    // Construct response
    const response = {
      jobId: job.jobId,
      name: job.name,
      description: job.description,
      type: job.type,
      prompt: job.prompt,
      repositories,
      createPullRequests: job.createPullRequests,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get job details',
        details: error.message
      }
    });
  }
});

/**
 * @route POST /jobs/:jobId/cancel
 * @desc Cancel a job
 * @access Public
 */
router.post('/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Get table names from environment variables
    const jobsTable = process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs';
    
    // Check if job exists
    const jobResult = await dynamoDbDocClient.send(new GetCommand({
      TableName: jobsTable,
      Key: { jobId }
    }));
    
    if (!jobResult.Item) {
      return res.status(404).json({
        error: {
          message: 'Job not found'
        }
      });
    }
    
    const job = jobResult.Item;
    
    // Check if job can be cancelled
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return res.status(400).json({
        error: {
          message: `Job cannot be cancelled (status: ${job.status})`
        }
      });
    }
    
    // Update job status to cancelled
    const cancelledAt = new Date().toISOString();
    await dynamoDbDocClient.send(new UpdateCommand({
      TableName: jobsTable,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, cancelledAt = :cancelledAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':cancelledAt': cancelledAt,
        ':updatedAt': cancelledAt
      }
    }));
    
    // TODO: Cancel AWS Batch job
    
    res.json({
      jobId,
      status: 'cancelled',
      cancelledAt
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      error: {
        message: 'Failed to cancel job',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /jobs/:jobId/repositories/:repoName
 * @desc Get repository job result
 * @access Public
 */
router.get('/:jobId/repositories/:repoName', async (req: Request, res: Response) => {
  try {
    const { jobId, repoName } = req.params;
    const repositoryName = decodeURIComponent(repoName);
    
    // Get table name from environment variables
    const reposTable = process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories';
    
    // Get repository from DynamoDB
    const repoResult = await dynamoDbDocClient.send(new GetCommand({
      TableName: reposTable,
      Key: { jobId, repositoryName }
    }));
    
    if (!repoResult.Item) {
      return res.status(404).json({
        error: {
          message: 'Repository result not found'
        }
      });
    }
    
    const repo = repoResult.Item;
    
    // Construct response
    const response = {
      jobId: repo.jobId,
      repositoryName: repo.repositoryName,
      status: repo.status,
      pullRequestUrl: repo.pullRequestUrl || null,
      wereChangesNecessary: repo.wereChangesNecessary !== undefined ? repo.wereChangesNecessary : null,
      startedAt: repo.startedAt || null,
      completedAt: repo.completedAt || null,
      changes: repo.changes || [],
      claudeConversation: repo.claudeConversation || {
        threadId: null,
        messages: []
      },
      logs: repo.logs || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting repository result:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get repository result',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /jobs/:jobId/repositories/:repoName/diff
 * @desc Get repository diff
 * @access Public
 */
router.get('/:jobId/repositories/:repoName/diff', async (req: Request, res: Response) => {
  try {
    const { jobId, repoName } = req.params;
    const repositoryName = decodeURIComponent(repoName);
    
    // Get table name from environment variables
    const reposTable = process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories';
    
    // Get repository from DynamoDB
    const repoResult = await dynamoDbDocClient.send(new GetCommand({
      TableName: reposTable,
      Key: { jobId, repositoryName }
    }));
    
    if (!repoResult.Item) {
      return res.status(404).json({
        error: {
          message: 'Repository result not found'
        }
      });
    }
    
    const repo = repoResult.Item;
    
    if (!repo.diff) {
      return res.status(404).json({
        error: {
          message: 'Diff not found'
        }
      });
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(repo.diff);
  } catch (error) {
    console.error('Error getting diff:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get diff',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /jobs/:jobId/repositories/:repoName/claude-thread
 * @desc Get Claude message thread
 * @access Public
 */
router.get('/:jobId/repositories/:repoName/claude-thread', async (req: Request, res: Response) => {
  try {
    const { jobId, repoName } = req.params;
    const repositoryName = decodeURIComponent(repoName);
    
    // Validate query parameters
    const { view, includeTool } = claudeThreadQuerySchema.parse(req.query);
    
    // Get table name from environment variables
    const reposTable = process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories';
    
    // Get repository from DynamoDB
    const repoResult = await dynamoDbDocClient.send(new GetCommand({
      TableName: reposTable,
      Key: { jobId, repositoryName }
    }));
    
    if (!repoResult.Item) {
      return res.status(404).json({
        error: {
          message: 'Repository result not found'
        }
      });
    }
    
    const repo = repoResult.Item;
    
    if (!repo.claudeConversation) {
      return res.status(404).json({
        error: {
          message: 'Claude thread not found'
        }
      });
    }
    
    // Filter messages based on view mode and includeTool
    let messages = repo.claudeConversation.messages || [];
    
    if (!includeTool) {
      messages = messages.filter((message: any) => 
        message.type !== 'tool_call' && message.type !== 'tool_result'
      );
    }
    
    if (view === 'simplified') {
      // For simplified view, only include prompts and responses
      messages = messages.filter((message: any) => 
        message.type === 'prompt' || message.type === 'response'
      );
    } else if (view === 'technical') {
      // Technical view includes everything
    } else {
      // Standard view includes everything but formats it differently
    }
    
    res.json({
      threadId: repo.claudeConversation.threadId,
      messages,
      tokenUsage: repo.claudeConversation.tokenUsage || {
        input: 0,
        output: 0,
        cacheCreation: 0,
        cacheRead: 0,
        total: 0
      }
    });
  } catch (error) {
    console.error('Error getting Claude thread:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid query parameters',
          details: error.errors
        }
      });
    }
    
    res.status(500).json({
      error: {
        message: 'Failed to get Claude thread',
        details: error.message
      }
    });
  }
});

/**
 * Submit job to AWS Batch
 */
async function submitBatchJob(batchClient: any, jobId: string): Promise<void> {
  try {
    console.log(`Submitting job ${jobId} to AWS Batch`);
    
    // Get AWS Batch configuration from environment variables
    const jobQueue = process.env.AWS_BATCH_JOB_QUEUE;
    const jobDefinition = process.env.AWS_BATCH_JOB_DEFINITION;
    
    if (!jobQueue || !jobDefinition) {
      console.error('AWS Batch configuration missing');
      throw new Error('AWS Batch configuration missing');
    }
    
    // Submit job to AWS Batch
    const command = new SubmitJobCommand({
      jobName: `cody-batch-${jobId}`,
      jobQueue,
      jobDefinition,
      parameters: {
        jobId,
        maxRepositories: '5'
      }
    });
    
    await batchClient.send(command);
    console.log(`Job ${jobId} submitted to AWS Batch`);
  } catch (error) {
    console.error(`Error submitting job ${jobId} to AWS Batch:`, error);
    throw error;
  }
}

export default router;