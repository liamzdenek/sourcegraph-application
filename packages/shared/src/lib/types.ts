/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Repository information
 */
export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  owner: {
    login: string;
    id: string;
  };
}

/**
 * Job repository result
 */
export interface RepositoryResult {
  repositoryId: string;
  repositoryName: string;
  status: JobStatus;
  wereChangesNecessary: boolean;
  message: string;
  pullRequestUrl?: string;
  diffUrl?: string;
  claudeThreadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Job information
 */
export interface Job {
  id: string;
  userId: string;
  prompt: string;
  repositories: Repository[];
  status: JobStatus;
  results: RepositoryResult[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Job creation request
 */
export interface CreateJobRequest {
  prompt: string;
  repositoryIds: string[];
}

/**
 * Job creation response
 */
export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  createdAt: string;
}

/**
 * Job list response
 */
export interface JobListResponse {
  jobs: Job[];
  total: number;
}

/**
 * Job detail response
 */
export interface JobDetailResponse {
  job: Job;
}

/**
 * Repository list response
 */
export interface RepositoryListResponse {
  repositories: Repository[];
  total: number;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

/**
 * Claude API response
 */
export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
}

/**
 * Claude message thread
 */
export interface ClaudeThread {
  id: string;
  messages: ClaudeResponse[];
}

/**
 * GitHub client configuration
 */
export interface GitHubClientConfig {
  token: string;
  allowedRepositories: string[];
  baseUrl?: string;
  tempDir?: string;
}

/**
 * Claude client configuration
 */
export interface ClaudeClientConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * API configuration
 */
export interface ApiConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  dynamoDb: {
    region: string;
    endpoint?: string;
    tablePrefix: string;
  };
  github: GitHubClientConfig;
  claude: ClaudeClientConfig;
}

/**
 * Batch configuration
 */
export interface BatchConfig {
  jobQueue: string;
  jobDefinition: string;
  region: string;
  dynamoDb: {
    region: string;
    endpoint?: string;
    tablePrefix: string;
  };
  github: GitHubClientConfig;
  claude: ClaudeClientConfig;
}