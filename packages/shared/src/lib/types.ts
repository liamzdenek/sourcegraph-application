export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum RepositoryStatus {
  PENDING = 'pending',
  PROCESSING = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Job {
  jobId: string;
  name: string;
  description?: string;
  type: string;
  prompt?: string;
  status: string; // Use string instead of enum to match API contract
  createdAt: string;
  startedAt?: string;
  completedAt?: string | null;
  repositoryCount: number;
  completedCount: number;
  createPullRequests?: boolean;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  isPrivate: boolean;
  owner: string;
  status: string; // Use string instead of enum to match API contract
  pullRequestUrl?: string | null;
  wereChangesNecessary?: boolean | null;
  completedAt?: string | null;
  logs?: Array<{
    timestamp: string;
    message: string;
    level: string;
  }>;
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, unknown>;
  error?: {
    message: string;
    code: string;
  };
}

export interface ApiConfig {
  port: number;
  environment?: 'development' | 'production' | 'test';
  dynamodbJobsTable?: string;
  dynamodbRepositoriesTable?: string;
  githubToken?: string;
  allowedRepositories?: string;
  awsBatchJobQueue?: string;
  awsBatchJobDefinition?: string;
  dynamoDb?: {
    region: string;
    endpoint?: string;
    tablePrefix: string;
  };
  github?: {
    token: string;
    allowedRepositories: string[];
    baseUrl?: string;
  };
  claude?: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export interface BatchConfig {
  dynamodbJobsTable?: string;
  dynamodbRepositoriesTable?: string;
  githubToken?: string;
  claudeApiKey?: string;
  allowedRepositories?: string;
  jobQueue?: string;
  jobDefinition?: string;
  region?: string;
  dynamoDb?: {
    region: string;
    endpoint?: string;
    tablePrefix: string;
  };
  github?: {
    token: string;
    allowedRepositories: string[];
    baseUrl?: string;
    tempDir?: string;
  };
  claude?: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  dependencies: {
    dynamodb: string;
    github: string;
    claude: string;
  };
}

export interface JobDetails extends Job {
  repositories: Array<{
    name: string;
    status: string;
    pullRequestUrl: string | null;
    wereChangesNecessary: boolean | null;
    completedAt: string | null;
  }>;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  type: string;
  prompt: string;
  repositories: string[];
  createPullRequests: boolean;
}

export interface RepositoryResult {
  jobId: string;
  repositoryName: string;
  status: string;
  pullRequestUrl?: string | null;
  wereChangesNecessary?: boolean | null;
  startedAt?: string | null;
  completedAt?: string | null;
  changes: Array<{
    file: string;
    diff: string;
  }>;
  claudeConversation?: {
    threadId: string;
    messages: Array<{
      role: string;
      content: string | Record<string, any>;
      timestamp: string;
      type: string;
    }>;
    tokenUsage: {
      input: number;
      output: number;
      cacheCreation: number;
      cacheRead: number;
      total: number;
    };
  };
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}

export interface ClaudeThread {
  threadId: string;
  messages: Array<{
    role: string;
    content: string | Record<string, any>;
    timestamp: string;
    type: string;
  }>;
  tokenUsage: {
    input: number;
    output: number;
    cacheCreation: number;
    cacheRead: number;
    total: number;
  };
}