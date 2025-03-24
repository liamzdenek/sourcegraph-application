import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
      createdAt: new Date().toISOString()
    };
    
    // Store job in DynamoDB
    await req.dynamoDb.send(new PutCommand({
      TableName: process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs',
      Item: job
    }));
    
    // Submit job to AWS Batch
    await submitBatchJob(req.batchClient, jobId);
    
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
    
    // This would normally query DynamoDB
    // For now, we'll return mock data
    const jobs = getMockJobs(status);
    
    // Paginate results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedJobs = jobs.slice(startIndex, endIndex);
    
    res.json({
      jobs: paginatedJobs,
      pagination: {
        page,
        perPage,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / perPage)
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
    
    // This would normally query DynamoDB
    // For now, we'll return mock data
    const job = getMockJobDetails(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: {
          message: 'Job not found'
        }
      });
    }
    
    res.json(job);
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
    
    // This would normally update the job in DynamoDB and cancel the AWS Batch job
    // For now, we'll return mock data
    const cancelledAt = new Date().toISOString();
    
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
    
    // This would normally query DynamoDB
    // For now, we'll return mock data
    const repositoryResult = getMockRepositoryResult(jobId, decodeURIComponent(repoName));
    
    if (!repositoryResult) {
      return res.status(404).json({
        error: {
          message: 'Repository result not found'
        }
      });
    }
    
    res.json(repositoryResult);
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
    
    // This would normally query DynamoDB
    // For now, we'll return mock data
    const diff = getMockDiff(jobId, decodeURIComponent(repoName));
    
    if (!diff) {
      return res.status(404).json({
        error: {
          message: 'Diff not found'
        }
      });
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(diff);
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
    
    // This would normally query DynamoDB
    // For now, we'll return mock data
    const claudeThread = getMockClaudeThread(jobId, decodeURIComponent(repoName));
    
    if (!claudeThread) {
      return res.status(404).json({
        error: {
          message: 'Claude thread not found'
        }
      });
    }
    
    res.json(claudeThread);
  } catch (error) {
    console.error('Error getting Claude thread:', error);
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
async function submitBatchJob(batchClient: BatchClient, jobId: string): Promise<void> {
  // In a real implementation, this would submit a job to AWS Batch
  console.log(`Submitting job ${jobId} to AWS Batch`);
  
  // Placeholder for AWS Batch job submission
  // const command = new SubmitJobCommand({
  //   jobName: `cody-batch-${jobId}`,
  //   jobQueue: process.env.AWS_BATCH_JOB_QUEUE,
  //   jobDefinition: process.env.AWS_BATCH_JOB_DEFINITION,
  //   parameters: {
  //     jobId
  //   }
  // });
  // await batchClient.send(command);
}

/**
 * Get mock jobs for development
 */
function getMockJobs(status?: string): any[] {
  const jobs = [
    {
      jobId: 'job-123',
      name: 'Update code patterns',
      type: 'code-pattern-update',
      status: 'in-progress',
      createdAt: '2025-03-24T12:00:00Z',
      repositoryCount: 2,
      completedCount: 1
    },
    {
      jobId: 'job-124',
      name: 'Fix security vulnerabilities',
      type: 'vulnerability-fix',
      status: 'completed',
      createdAt: '2025-03-23T12:00:00Z',
      repositoryCount: 1,
      completedCount: 1
    }
  ];
  
  if (status) {
    return jobs.filter(job => job.status === status);
  }
  
  return jobs;
}

/**
 * Get mock job details for development
 */
function getMockJobDetails(jobId: string): any {
  if (jobId === 'job-123') {
    return {
      jobId: 'job-123',
      name: 'Update code patterns',
      description: 'Apply a specific code change across repositories',
      type: 'code-pattern-update',
      prompt: 'You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of \'oldFunction(param)\' with \'newFunction(param, { version: 2 })\'.',
      repositories: [
        {
          name: 'liamzdenek/repo1',
          status: 'completed',
          pullRequestUrl: 'https://github.com/liamzdenek/repo1/pull/1',
          wereChangesNecessary: true,
          completedAt: '2025-03-24T12:30:00Z'
        },
        {
          name: 'liamzdenek/repo2',
          status: 'in-progress',
          pullRequestUrl: null,
          wereChangesNecessary: null,
          completedAt: null
        }
      ],
      createPullRequests: true,
      status: 'in-progress',
      createdAt: '2025-03-24T12:00:00Z',
      startedAt: '2025-03-24T12:01:00Z',
      completedAt: null
    };
  }
  
  return null;
}

/**
 * Get mock repository result for development
 */
function getMockRepositoryResult(jobId: string, repoName: string): any {
  if (jobId === 'job-123' && repoName === 'liamzdenek/repo1') {
    return {
      jobId: 'job-123',
      repositoryName: 'liamzdenek/repo1',
      status: 'completed',
      pullRequestUrl: 'https://github.com/liamzdenek/repo1/pull/1',
      wereChangesNecessary: true,
      startedAt: '2025-03-24T12:05:00Z',
      completedAt: '2025-03-24T12:30:00Z',
      changes: [
        {
          file: 'src/api.js',
          diff: '--- a/src/api.js\n+++ b/src/api.js\n@@ -10,7 +10,7 @@\n function fetchData(id) {\n-  return oldFunction(id);\n+  return newFunction(id, { version: 2 });\n }'
        },
        {
          file: 'src/utils.js',
          diff: '--- a/src/utils.js\n+++ b/src/utils.js\n@@ -15,7 +15,7 @@\n function processItem(item) {\n-  const result = oldFunction(item.id);\n+  const result = newFunction(item.id, { version: 2 });\n   return result;\n }'
        }
      ],
      claudeMessages: {
        finalMessage: 'I\'ve updated all instances of the deprecated API call `oldFunction(param)` to use the new format `newFunction(param, { version: 2 })`. I found and updated 2 occurrences across 2 files.',
        threadId: 'thread-123'
      },
      logs: [
        {
          timestamp: '2025-03-24T12:05:00Z',
          level: 'INFO',
          message: 'Starting repository analysis'
        },
        {
          timestamp: '2025-03-24T12:10:00Z',
          level: 'INFO',
          message: 'Found deprecated API call in src/api.js'
        },
        {
          timestamp: '2025-03-24T12:15:00Z',
          level: 'INFO',
          message: 'Found deprecated API call in src/utils.js'
        },
        {
          timestamp: '2025-03-24T12:20:00Z',
          level: 'INFO',
          message: 'Generated fixes for affected files'
        },
        {
          timestamp: '2025-03-24T12:25:00Z',
          level: 'INFO',
          message: 'Creating pull request'
        },
        {
          timestamp: '2025-03-24T12:30:00Z',
          level: 'INFO',
          message: 'Pull request created: https://github.com/liamzdenek/repo1/pull/1'
        }
      ]
    };
  }
  
  return null;
}

/**
 * Get mock diff for development
 */
function getMockDiff(jobId: string, repoName: string): string | null {
  if (jobId === 'job-123' && repoName === 'liamzdenek/repo1') {
    return `diff --git a/src/api.js b/src/api.js
index 1234567..abcdefg 100644
--- a/src/api.js
+++ b/src/api.js
@@ -10,7 +10,7 @@ function fetchData(id) {
-  return oldFunction(id);
+  return newFunction(id, { version: 2 });
 }

diff --git a/src/utils.js b/src/utils.js
index 7654321..gfedcba 100644
--- a/src/utils.js
+++ b/src/utils.js
@@ -15,7 +15,7 @@ function processItem(item) {
-  const result = oldFunction(item.id);
+  const result = newFunction(item.id, { version: 2 });
   return result;
 }`;
  }
  
  return null;
}

/**
 * Get mock Claude thread for development
 */
function getMockClaudeThread(jobId: string, repoName: string): any {
  if (jobId === 'job-123' && repoName === 'liamzdenek/repo1') {
    return {
      threadId: 'thread-123',
      messages: [
        {
          role: 'human',
          content: 'You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of \'oldFunction(param)\' with \'newFunction(param, { version: 2 })\'. Here\'s the first file to analyze:\n\nsrc/api.js:\n```javascript\nfunction fetchData(id) {\n  return oldFunction(id);\n}\n```',
          timestamp: '2025-03-24T12:10:00Z'
        },
        {
          role: 'assistant',
          content: 'I\'ll update the deprecated API call in this file. Here\'s the change I\'ll make:\n\n```javascript\nfunction fetchData(id) {\n  return newFunction(id, { version: 2 });\n}\n```\n\nThis replaces the deprecated `oldFunction(param)` with the new format `newFunction(param, { version: 2 })` as requested.',
          timestamp: '2025-03-24T12:10:30Z'
        },
        {
          role: 'human',
          content: 'Here\'s another file to analyze:\n\nsrc/utils.js:\n```javascript\nfunction processItem(item) {\n  const result = oldFunction(item.id);\n  return result;\n}\n```',
          timestamp: '2025-03-24T12:15:00Z'
        },
        {
          role: 'assistant',
          content: 'I\'ll update the deprecated API call in this file as well. Here\'s the change I\'ll make:\n\n```javascript\nfunction processItem(item) {\n  const result = newFunction(item.id, { version: 2 });\n  return result;\n}\n```\n\nThis replaces the deprecated `oldFunction(param)` with the new format `newFunction(param, { version: 2 })` as requested.',
          timestamp: '2025-03-24T12:15:30Z'
        },
        {
          role: 'human',
          content: 'Please summarize all the changes you\'ve made.',
          timestamp: '2025-03-24T12:20:00Z'
        },
        {
          role: 'assistant',
          content: 'I\'ve updated all instances of the deprecated API call `oldFunction(param)` to use the new format `newFunction(param, { version: 2 })`. I found and updated 2 occurrences across 2 files:\n\n1. In `src/api.js`: Updated the call in the `fetchData` function\n2. In `src/utils.js`: Updated the call in the `processItem` function\n\nAll instances have been successfully updated to use the new API format.',
          timestamp: '2025-03-24T12:20:30Z'
        }
      ]
    };
  }
  
  return null;
}

export default router;