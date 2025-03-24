import axios from 'axios';
import type { 
  Job, 
  Repository, 
  JobStatus, 
  RepositoryStatus, 
  HealthResponse, 
  JobDetails, 
  CreateJobRequest, 
  RepositoryResult, 
  ClaudeThread 
} from '../../../shared/src/index';

export type { 
  Job, 
  Repository, 
  JobStatus, 
  RepositoryStatus, 
  HealthResponse, 
  JobDetails, 
  CreateJobRequest, 
  RepositoryResult, 
  ClaudeThread 
};

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extend the AxiosInstance type to include our custom methods
interface ApiClient {
  getHealth(): Promise<HealthResponse>;
  getRepositories(page?: number, perPage?: number, filter?: string): Promise<{ repositories: Repository[] }>;
  getJobs(page?: number, perPage?: number, status?: JobStatus): Promise<{ jobs: Job[] }>;
  getJobDetails(jobId: string): Promise<JobDetails>;
  createJob(job: CreateJobRequest): Promise<JobDetails>;
  cancelJob(jobId: string): Promise<void>;
  getRepositoryResult(jobId: string, repoName: string): Promise<RepositoryResult>;
  getRepositoryDiff(jobId: string, repoName: string): Promise<string>;
  getClaudeThread(
    jobId: string, 
    repoName: string, 
    view?: 'standard' | 'technical' | 'simplified',
    includeTool?: boolean
  ): Promise<ClaudeThread>;
}

// Add the API methods to the axios instance
const apiClient = api as unknown as ApiClient;

// Health check function
apiClient.getHealth = async (): Promise<HealthResponse> => {
  const response = await api.get('/health');
  return response.data;
};

// Repositories API
apiClient.getRepositories = async (page = 1, perPage = 10, filter?: string): Promise<{ repositories: Repository[] }> => {
  const params = { page, perPage, filter };
  const response = await api.get('/repositories', { params });
  return response.data;
};

// Jobs API
apiClient.getJobs = async (page = 1, perPage = 10, status?: JobStatus): Promise<{ jobs: Job[] }> => {
  const params = { page, perPage, status };
  const response = await api.get('/jobs', { params });
  return response.data;
};

apiClient.getJobDetails = async (jobId: string): Promise<JobDetails> => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    
    // Validate the response data
    if (!response.data) {
      console.error('API returned empty response for job details');
      throw new Error('Job details not found');
    }
    
    // Log the response for debugging
    console.log('Job details response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching job details for job ${jobId}:`, error);
    throw error;
  }
};

apiClient.createJob = async (job: CreateJobRequest): Promise<JobDetails> => {
  const response = await api.post('/jobs', job);
  return response.data;
};

apiClient.cancelJob = async (jobId: string): Promise<void> => {
  await api.post(`/jobs/${jobId}/cancel`);
};

// Repository API
apiClient.getRepositoryResult = async (jobId: string, repoName: string): Promise<RepositoryResult> => {
  const response = await api.get(`/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}`);
  return response.data;
};

apiClient.getRepositoryDiff = async (jobId: string, repoName: string): Promise<string> => {
  const response = await api.get(`/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}/diff`);
  return response.data;
};

// Claude thread API
apiClient.getClaudeThread = async (
  jobId: string, 
  repoName: string, 
  view: 'standard' | 'technical' | 'simplified' = 'standard',
  includeTool = true
): Promise<ClaudeThread> => {
  const params = { view, includeTool };
  const response = await api.get(
    `/jobs/${jobId}/repositories/${encodeURIComponent(repoName)}/claude-thread`, 
    { params }
  );
  return response.data;
};

export { apiClient };

export default api;