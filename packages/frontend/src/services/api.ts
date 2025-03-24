/**
 * API service for interacting with the Cody Batch API
 */

// Base URL for the API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cody-batch.example.com';

/**
 * Health check response
 */
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

/**
 * Repository
 */
export interface Repository {
  id: string;
  name: string;
  description: string;
  url: string;
}

/**
 * Pagination
 */
export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Repository list response
 */
export interface RepositoryListResponse {
  repositories: Repository[];
  pagination: Pagination;
}

/**
 * Job status
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Job
 */
export interface Job {
  jobId: string;
  name: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  repositoryCount: number;
  completedCount: number;
}

/**
 * Job list response
 */
export interface JobListResponse {
  jobs: Job[];
  pagination: Pagination;
}

/**
 * Repository status in a job
 */
export interface RepositoryStatus {
  name: string;
  status: JobStatus;
  pullRequestUrl: string | null;
  wereChangesNecessary: boolean | null;
  completedAt: string | null;
}

/**
 * Job details
 */
export interface JobDetails {
  jobId: string;
  name: string;
  description: string;
  type: string;
  prompt: string;
  repositories: RepositoryStatus[];
  createPullRequests: boolean;
  status: JobStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Job creation request
 */
export interface CreateJobRequest {
  name: string;
  description?: string;
  type: string;
  prompt: string;
  repositories: string[];
  createPullRequests: boolean;
}

/**
 * File change
 */
export interface FileChange {
  file: string;
  diff: string;
}

/**
 * Claude message
 */
export interface ClaudeMessage {
  role: 'human' | 'assistant';
  content: string | { tool: string; input: any } | { result: any };
  timestamp: string;
  type: 'prompt' | 'response' | 'tool_call' | 'tool_result';
}

/**
 * Token usage
 */
export interface TokenUsage {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

/**
 * Repository result
 */
export interface RepositoryResult {
  jobId: string;
  repositoryName: string;
  status: JobStatus;
  pullRequestUrl: string | null;
  wereChangesNecessary: boolean;
  startedAt: string;
  completedAt: string;
  changes: FileChange[];
  claudeConversation: {
    threadId: string;
    messages: ClaudeMessage[];
    tokenUsage: TokenUsage;
  };
  logs: LogEntry[];
}

/**
 * Claude thread
 */
export interface ClaudeThread {
  threadId: string;
  messages: ClaudeMessage[];
  tokenUsage: TokenUsage;
}

/**
 * API client
 */
class ApiClient {
  /**
   * Get health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.get<HealthResponse>('/health');
  }

  /**
   * Get repositories
   */
  async getRepositories(page = 1, perPage = 10, filter?: string): Promise<RepositoryListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    if (filter) {
      params.append('filter', filter);
    }

    return this.get<RepositoryListResponse>(`/repositories?${params.toString()}`);
  }

  /**
   * Get jobs
   */
  async getJobs(page = 1, perPage = 10, status?: JobStatus): Promise<JobListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return this.get<JobListResponse>(`/jobs?${params.toString()}`);
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<JobDetails> {
    return this.get<JobDetails>(`/jobs/${jobId}`);
  }

  /**
   * Create job
   */
  async createJob(job: CreateJobRequest): Promise<JobDetails> {
    return this.post<JobDetails>('/jobs', job);
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<{ jobId: string; status: JobStatus; cancelledAt: string }> {
    return this.post<{ jobId: string; status: JobStatus; cancelledAt: string }>(`/jobs/${jobId}/cancel`, {});
  }

  /**
   * Get repository result
   */
  async getRepositoryResult(jobId: string, repoName: string): Promise<RepositoryResult> {
    return this.get<RepositoryResult>(`/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}`);
  }

  /**
   * Get repository diff
   */
  async getRepositoryDiff(jobId: string, repoName: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}/diff`);
    
    if (!response.ok) {
      throw new Error(`Failed to get repository diff: ${response.statusText}`);
    }
    
    return response.text();
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
    const params = new URLSearchParams({
      view,
      includeTool: includeTool.toString(),
    });
    
    return this.get<ClaudeThread>(
      `/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}/claude-thread?${params.toString()}`
    );
  }

  /**
   * Generic GET request
   */
  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Generic POST request
   */
  private async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();