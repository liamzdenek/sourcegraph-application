/**
 * Mock API service for local development and testing
 * 
 * This service provides mock data for the API endpoints
 * to allow for local development and testing without
 * having to deploy the backend.
 */

import { 
  HealthResponse, 
  Repository, 
  Job, 
  JobDetails, 
  CreateJobRequest,
  RepositoryResult,
  ClaudeThread,
  JobStatus,
  RepositoryStatus
} from './api';

// Mock repositories
const mockRepositories: Repository[] = [
  {
    id: 'repo1',
    name: 'liamzdenek/repo1',
    description: 'Repository description',
    url: 'https://github.com/liamzdenek/repo1'
  },
  {
    id: 'repo2',
    name: 'liamzdenek/repo2',
    description: 'Another repository',
    url: 'https://github.com/liamzdenek/repo2'
  },
  {
    id: 'repo3',
    name: 'liamzdenek/repo3',
    description: 'Third repository',
    url: 'https://github.com/liamzdenek/repo3'
  }
];

// Mock jobs
const mockJobs: Job[] = [
  {
    jobId: 'job-123',
    name: 'Update code patterns',
    type: 'code-pattern-update',
    status: 'completed',
    createdAt: '2025-03-24T12:00:00Z',
    repositoryCount: 2,
    completedCount: 2
  },
  {
    jobId: 'job-124',
    name: 'Fix security vulnerabilities',
    type: 'vulnerability-fix',
    status: 'processing',
    createdAt: '2025-03-24T13:00:00Z',
    repositoryCount: 3,
    completedCount: 1
  },
  {
    jobId: 'job-125',
    name: 'Code cleanup',
    type: 'code-cleanup',
    status: 'pending',
    createdAt: '2025-03-24T14:00:00Z',
    repositoryCount: 2,
    completedCount: 0
  }
];

// Mock repository statuses
const mockRepositoryStatuses: Record<string, RepositoryStatus[]> = {
  'job-123': [
    {
      name: 'liamzdenek/repo1',
      status: 'completed',
      pullRequestUrl: 'https://github.com/liamzdenek/repo1/pull/1',
      wereChangesNecessary: true,
      completedAt: '2025-03-24T12:30:00Z'
    },
    {
      name: 'liamzdenek/repo2',
      status: 'completed',
      pullRequestUrl: 'https://github.com/liamzdenek/repo2/pull/1',
      wereChangesNecessary: true,
      completedAt: '2025-03-24T12:45:00Z'
    }
  ],
  'job-124': [
    {
      name: 'liamzdenek/repo1',
      status: 'completed',
      pullRequestUrl: 'https://github.com/liamzdenek/repo1/pull/2',
      wereChangesNecessary: true,
      completedAt: '2025-03-24T13:30:00Z'
    },
    {
      name: 'liamzdenek/repo2',
      status: 'processing',
      pullRequestUrl: null,
      wereChangesNecessary: null,
      completedAt: null
    },
    {
      name: 'liamzdenek/repo3',
      status: 'pending',
      pullRequestUrl: null,
      wereChangesNecessary: null,
      completedAt: null
    }
  ],
  'job-125': [
    {
      name: 'liamzdenek/repo1',
      status: 'pending',
      pullRequestUrl: null,
      wereChangesNecessary: null,
      completedAt: null
    },
    {
      name: 'liamzdenek/repo2',
      status: 'pending',
      pullRequestUrl: null,
      wereChangesNecessary: null,
      completedAt: null
    }
  ]
};

// Mock job details
const mockJobDetails: Record<string, JobDetails> = {
  'job-123': {
    jobId: 'job-123',
    name: 'Update code patterns',
    description: 'Apply a specific code change across repositories',
    type: 'code-pattern-update',
    prompt: "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of 'oldFunction(param)' with 'newFunction(param, { version: 2 })'.",
    repositories: mockRepositoryStatuses['job-123'],
    createPullRequests: true,
    status: 'completed',
    createdAt: '2025-03-24T12:00:00Z',
    startedAt: '2025-03-24T12:01:00Z',
    completedAt: '2025-03-24T12:45:00Z'
  },
  'job-124': {
    jobId: 'job-124',
    name: 'Fix security vulnerabilities',
    description: 'Fix security vulnerabilities in repositories',
    type: 'vulnerability-fix',
    prompt: "You are an expert software engineer. Your task is to fix security vulnerabilities in the code.",
    repositories: mockRepositoryStatuses['job-124'],
    createPullRequests: true,
    status: 'processing',
    createdAt: '2025-03-24T13:00:00Z',
    startedAt: '2025-03-24T13:01:00Z',
    completedAt: null
  },
  'job-125': {
    jobId: 'job-125',
    name: 'Code cleanup',
    description: 'Clean up code in repositories',
    type: 'code-cleanup',
    prompt: "You are an expert software engineer. Your task is to clean up code in the repositories.",
    repositories: mockRepositoryStatuses['job-125'],
    createPullRequests: true,
    status: 'pending',
    createdAt: '2025-03-24T14:00:00Z',
    startedAt: null,
    completedAt: null
  }
};

// Mock repository results
const mockRepositoryResults: Record<string, Record<string, RepositoryResult>> = {
  'job-123': {
    'liamzdenek/repo1': {
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
          diff: "--- a/src/api.js\n+++ b/src/api.js\n@@ -10,7 +10,7 @@\n function fetchData(id) {\n-  return oldFunction(id);\n+  return newFunction(id, { version: 2 });\n }"
        },
        {
          file: 'src/utils.js',
          diff: "--- a/src/utils.js\n+++ b/src/utils.js\n@@ -15,7 +15,7 @@\n function processItem(item) {\n-  const result = oldFunction(item.id);\n+  const result = newFunction(item.id, { version: 2 });\n   return result;\n }"
        }
      ],
      claudeConversation: {
        threadId: 'thread-123',
        messages: [
          {
            role: 'human',
            content: "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format.",
            timestamp: '2025-03-24T12:10:00Z',
            type: 'prompt'
          },
          {
            role: 'assistant',
            content: "I'll update the deprecated API call in this file.",
            timestamp: '2025-03-24T12:10:30Z',
            type: 'response'
          }
        ],
        tokenUsage: {
          input: 1750,
          output: 982,
          cacheCreation: 0,
          cacheRead: 0,
          total: 2732
        }
      },
      logs: [
        {
          timestamp: '2025-03-24T12:05:00Z',
          level: 'INFO',
          message: 'Starting repository analysis'
        },
        {
          timestamp: '2025-03-24T12:30:00Z',
          level: 'INFO',
          message: 'Pull request created: https://github.com/liamzdenek/repo1/pull/1'
        }
      ]
    }
  }
};

/**
 * Mock API client
 */
class MockApiClient {
  /**
   * Get health status
   */
  async getHealth(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        dynamodb: 'healthy',
        github: 'healthy',
        claude: 'healthy'
      }
    };
  }

  /**
   * Get repositories
   */
  async getRepositories(page = 1, perPage = 10, filter?: string): Promise<{
    repositories: Repository[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Filter repositories if filter is provided
    let filteredRepositories = mockRepositories;
    if (filter) {
      filteredRepositories = mockRepositories.filter(repo => 
        repo.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Calculate pagination
    const total = filteredRepositories.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedRepositories = filteredRepositories.slice(startIndex, endIndex);

    return {
      repositories: paginatedRepositories,
      pagination: {
        page,
        perPage,
        total,
        totalPages
      }
    };
  }

  /**
   * Get jobs
   */
  async getJobs(page = 1, perPage = 10, status?: JobStatus): Promise<{
    jobs: Job[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Filter jobs if status is provided
    let filteredJobs = mockJobs;
    if (status) {
      filteredJobs = mockJobs.filter(job => job.status === status);
    }

    // Calculate pagination
    const total = filteredJobs.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return {
      jobs: paginatedJobs,
      pagination: {
        page,
        perPage,
        total,
        totalPages
      }
    };
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<JobDetails> {
    const jobDetails = mockJobDetails[jobId];
    if (!jobDetails) {
      throw new Error(`Job not found: ${jobId}`);
    }
    return jobDetails;
  }

  /**
   * Create job
   */
  async createJob(job: CreateJobRequest): Promise<JobDetails> {
    const jobId = `job-${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    const repositories = job.repositories.map(repoName => ({
      name: repoName,
      status: 'pending' as JobStatus,
      pullRequestUrl: null,
      wereChangesNecessary: null,
      completedAt: null
    }));
    
    const newJob: JobDetails = {
      jobId,
      name: job.name,
      description: job.description || '',
      type: job.type,
      prompt: job.prompt,
      repositories,
      createPullRequests: job.createPullRequests,
      status: 'pending',
      createdAt,
      startedAt: null,
      completedAt: null
    };
    
    // Add to mock data
    mockJobDetails[jobId] = newJob;
    mockJobs.unshift({
      jobId,
      name: job.name,
      type: job.type,
      status: 'pending',
      createdAt,
      repositoryCount: job.repositories.length,
      completedCount: 0
    });
    
    return newJob;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<{ jobId: string; status: JobStatus; cancelledAt: string }> {
    const job = mockJobDetails[jobId];
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    const cancelledAt = new Date().toISOString();
    
    // Update job status
    job.status = 'cancelled';
    
    // Update job in jobs list
    const jobIndex = mockJobs.findIndex(j => j.jobId === jobId);
    if (jobIndex !== -1) {
      mockJobs[jobIndex].status = 'cancelled';
    }
    
    return {
      jobId,
      status: 'cancelled',
      cancelledAt
    };
  }

  /**
   * Get repository result
   */
  async getRepositoryResult(jobId: string, repoName: string): Promise<RepositoryResult> {
    const repoResult = mockRepositoryResults[jobId]?.[repoName];
    if (!repoResult) {
      throw new Error(`Repository result not found: ${jobId}/${repoName}`);
    }
    return repoResult;
  }

  /**
   * Get repository diff
   */
  async getRepositoryDiff(jobId: string, repoName: string): Promise<string> {
    const repoResult = mockRepositoryResults[jobId]?.[repoName];
    if (!repoResult) {
      throw new Error(`Repository result not found: ${jobId}/${repoName}`);
    }
    
    return repoResult.changes.map(change => change.diff).join('\n\n');
  }

  /**
   * Get Claude thread
   */
  async getClaudeThread(
    jobId: string, 
    repoName: string, 
    view: 'standard' | 'technical' | 'simplified' = 'standard', 
    includeTool = true
  ): Promise<ClaudeThread> {
    const repoResult = mockRepositoryResults[jobId]?.[repoName];
    if (!repoResult) {
      throw new Error(`Repository result not found: ${jobId}/${repoName}`);
    }
    
    return repoResult.claudeConversation;
  }
}

// Export a singleton instance
export const mockApiClient = new MockApiClient();