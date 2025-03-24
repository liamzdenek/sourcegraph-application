import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  apiClient, 
  HealthResponse, 
  Repository, 
  Job, 
  JobDetails, 
  CreateJobRequest,
  RepositoryResult,
  ClaudeThread,
  JobStatus
} from '../services/api';

// Status type
type Status = 'idle' | 'loading' | 'success' | 'error';

// Map React Query status to our status
function mapStatus(status: 'pending' | 'error' | 'success'): Status {
  if (status === 'pending') return 'loading';
  return status;
}

// Context interface
interface ApiContextType {
  // Health
  health: HealthResponse | undefined;
  healthStatus: Status;
  refreshHealth: () => void;
  
  // Repositories
  repositories: Repository[];
  repositoriesStatus: Status;
  repositoriesError: Error | null;
  loadRepositories: (page?: number, perPage?: number, filter?: string) => void;
  
  // Jobs
  jobs: Job[];
  jobsStatus: Status;
  jobsError: Error | null;
  loadJobs: (page?: number, perPage?: number, status?: JobStatus) => void;
  refreshJobs: () => void;
  
  // Job details
  currentJob: JobDetails | undefined;
  currentJobStatus: Status;
  currentJobError: Error | null;
  loadJobDetails: (jobId: string) => void;
  refreshCurrentJob: () => void;
  
  // Create job
  createJob: (job: CreateJobRequest) => Promise<JobDetails>;
  createJobStatus: Status;
  createJobError: Error | null;
  
  // Cancel job
  cancelJob: (jobId: string) => Promise<void>;
  cancelJobStatus: Status;
  cancelJobError: Error | null;
  
  // Repository result
  currentRepository: RepositoryResult | undefined;
  currentRepositoryStatus: Status;
  currentRepositoryError: Error | null;
  loadRepositoryResult: (jobId: string, repoName: string) => void;
  
  // Repository diff
  currentDiff: string | undefined;
  currentDiffStatus: Status;
  currentDiffError: Error | null;
  loadRepositoryDiff: (jobId: string, repoName: string) => void;
  
  // Claude thread
  currentClaudeThread: ClaudeThread | undefined;
  currentClaudeThreadStatus: Status;
  currentClaudeThreadError: Error | null;
  loadClaudeThread: (
    jobId: string, 
    repoName: string, 
    view?: 'standard' | 'technical' | 'simplified', 
    includeTool?: boolean
  ) => void;
}

// Create context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Provider props
interface ApiProviderProps {
  children: ReactNode;
}

// Provider component
export function ApiProvider({ children }: ApiProviderProps) {
  const queryClient = useQueryClient();
  
  // Health
  const { 
    data: health, 
    status: healthQueryStatus, 
    refetch: refreshHealth 
  } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    staleTime: 60000, // 1 minute
  });
  
  // Repositories
  const [repositoriesParams, setRepositoriesParams] = useState({
    page: 1,
    perPage: 10,
    filter: undefined as string | undefined,
  });
  
  const {
    data: repositoriesData,
    status: repositoriesQueryStatus,
    error: repositoriesError,
    refetch: refreshRepositories
  } = useQuery({
    queryKey: ['repositories', repositoriesParams],
    queryFn: () => apiClient.getRepositories(
      repositoriesParams.page,
      repositoriesParams.perPage,
      repositoriesParams.filter
    ),
    staleTime: 60000, // 1 minute
  });
  
  const loadRepositories = (page = 1, perPage = 10, filter?: string) => {
    setRepositoriesParams({ page, perPage, filter });
  };
  
  // Jobs
  const [jobsParams, setJobsParams] = useState({
    page: 1,
    perPage: 10,
    status: undefined as JobStatus | undefined,
  });
  
  const {
    data: jobsData,
    status: jobsQueryStatus,
    error: jobsError,
    refetch: refreshJobs
  } = useQuery({
    queryKey: ['jobs', jobsParams],
    queryFn: () => apiClient.getJobs(
      jobsParams.page,
      jobsParams.perPage,
      jobsParams.status
    ),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const loadJobs = (page = 1, perPage = 10, status?: JobStatus) => {
    setJobsParams({ page, perPage, status });
  };
  
  // Job details
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  const {
    data: currentJob,
    status: currentJobQueryStatus,
    error: currentJobError,
    refetch: refreshCurrentJob
  } = useQuery({
    queryKey: ['job', currentJobId],
    queryFn: () => apiClient.getJobDetails(currentJobId!),
    enabled: !!currentJobId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const loadJobDetails = (jobId: string) => {
    setCurrentJobId(jobId);
  };
  
  // Create job
  const {
    mutateAsync: createJobMutation,
    status: createJobQueryStatus,
    error: createJobError,
  } = useMutation({
    mutationFn: (job: CreateJobRequest) => apiClient.createJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
  
  const createJob = async (job: CreateJobRequest) => {
    return createJobMutation(job);
  };
  
  // Cancel job
  const {
    mutateAsync: cancelJobMutation,
    status: cancelJobQueryStatus,
    error: cancelJobError,
  } = useMutation({
    mutationFn: (jobId: string) => apiClient.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });
  
  const cancelJob = async (jobId: string) => {
    await cancelJobMutation(jobId);
  };
  
  // Repository result
  const [repositoryParams, setRepositoryParams] = useState<{ jobId: string; repoName: string } | null>(null);
  
  const {
    data: currentRepository,
    status: currentRepositoryQueryStatus,
    error: currentRepositoryError,
  } = useQuery({
    queryKey: ['repository', repositoryParams?.jobId, repositoryParams?.repoName],
    queryFn: () => apiClient.getRepositoryResult(repositoryParams!.jobId, repositoryParams!.repoName),
    enabled: !!repositoryParams,
    staleTime: 30000, // 30 seconds
  });
  
  const loadRepositoryResult = (jobId: string, repoName: string) => {
    setRepositoryParams({ jobId, repoName });
  };
  
  // Repository diff
  const [diffParams, setDiffParams] = useState<{ jobId: string; repoName: string } | null>(null);
  
  const {
    data: currentDiff,
    status: currentDiffQueryStatus,
    error: currentDiffError,
  } = useQuery({
    queryKey: ['diff', diffParams?.jobId, diffParams?.repoName],
    queryFn: () => apiClient.getRepositoryDiff(diffParams!.jobId, diffParams!.repoName),
    enabled: !!diffParams,
    staleTime: 60000, // 1 minute
  });
  
  const loadRepositoryDiff = (jobId: string, repoName: string) => {
    setDiffParams({ jobId, repoName });
  };
  
  // Claude thread
  const [claudeThreadParams, setClaudeThreadParams] = useState<{
    jobId: string;
    repoName: string;
    view?: 'standard' | 'technical' | 'simplified';
    includeTool?: boolean;
  } | null>(null);
  
  const {
    data: currentClaudeThread,
    status: currentClaudeThreadQueryStatus,
    error: currentClaudeThreadError,
  } = useQuery({
    queryKey: [
      'claudeThread',
      claudeThreadParams?.jobId,
      claudeThreadParams?.repoName,
      claudeThreadParams?.view,
      claudeThreadParams?.includeTool,
    ],
    queryFn: () => apiClient.getClaudeThread(
      claudeThreadParams!.jobId,
      claudeThreadParams!.repoName,
      claudeThreadParams!.view,
      claudeThreadParams!.includeTool
    ),
    enabled: !!claudeThreadParams,
    staleTime: 60000, // 1 minute
  });
  
  const loadClaudeThread = (
    jobId: string,
    repoName: string,
    view: 'standard' | 'technical' | 'simplified' = 'standard',
    includeTool = true
  ) => {
    setClaudeThreadParams({ jobId, repoName, view, includeTool });
  };
  
  // Map mutation status to our status
  function mapMutationStatus(status: 'idle' | 'pending' | 'success' | 'error'): Status {
    if (status === 'pending') return 'loading';
    return status as Status;
  }
  
  // Context value
  const value: ApiContextType = {
    // Health
    health,
    healthStatus: mapStatus(healthQueryStatus),
    refreshHealth,
    
    // Repositories
    repositories: repositoriesData?.repositories || [],
    repositoriesStatus: mapStatus(repositoriesQueryStatus),
    repositoriesError: repositoriesError as Error | null,
    loadRepositories,
    
    // Jobs
    jobs: jobsData?.jobs || [],
    jobsStatus: mapStatus(jobsQueryStatus),
    jobsError: jobsError as Error | null,
    loadJobs,
    refreshJobs,
    
    // Job details
    currentJob,
    currentJobStatus: mapStatus(currentJobQueryStatus),
    currentJobError: currentJobError as Error | null,
    loadJobDetails,
    refreshCurrentJob,
    
    // Create job
    createJob,
    createJobStatus: mapMutationStatus(createJobQueryStatus),
    createJobError: createJobError as Error | null,
    
    // Cancel job
    cancelJob,
    cancelJobStatus: mapMutationStatus(cancelJobQueryStatus),
    cancelJobError: cancelJobError as Error | null,
    
    // Repository result
    currentRepository,
    currentRepositoryStatus: mapStatus(currentRepositoryQueryStatus),
    currentRepositoryError: currentRepositoryError as Error | null,
    loadRepositoryResult,
    
    // Repository diff
    currentDiff,
    currentDiffStatus: mapStatus(currentDiffQueryStatus),
    currentDiffError: currentDiffError as Error | null,
    loadRepositoryDiff,
    
    // Claude thread
    currentClaudeThread,
    currentClaudeThreadStatus: mapStatus(currentClaudeThreadQueryStatus),
    currentClaudeThreadError: currentClaudeThreadError as Error | null,
    loadClaudeThread,
  };
  
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// Hook for using the API context
export function useApiContext() {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApiContext must be used within an ApiProvider');
  }
  
  return context;
}

// For backward compatibility
export const useApi = useApiContext;