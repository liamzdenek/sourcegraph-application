import { z } from 'zod';
import { JobStatus } from './types';

/**
 * Repository schema
 */
export const repositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  isPrivate: z.boolean(),
  owner: z.object({
    login: z.string(),
    id: z.string(),
  }),
});

/**
 * Repository result schema
 */
export const repositoryResultSchema = z.object({
  repositoryId: z.string(),
  repositoryName: z.string(),
  status: z.nativeEnum(JobStatus),
  wereChangesNecessary: z.boolean(),
  message: z.string(),
  pullRequestUrl: z.string().url().optional(),
  diffUrl: z.string().url().optional(),
  claudeThreadUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Job schema
 */
export const jobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string().min(10).max(1000),
  repositories: z.array(repositorySchema),
  status: z.nativeEnum(JobStatus),
  results: z.array(repositoryResultSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

/**
 * Create job request schema
 */
export const createJobRequestSchema = z.object({
  prompt: z.string().min(10).max(1000),
  repositoryIds: z.array(z.string()).min(1).max(5),
});

/**
 * Create job response schema
 */
export const createJobResponseSchema = z.object({
  jobId: z.string(),
  status: z.nativeEnum(JobStatus),
  createdAt: z.string().datetime(),
});

/**
 * Job list response schema
 */
export const jobListResponseSchema = z.object({
  jobs: z.array(jobSchema),
  total: z.number().int().nonnegative(),
});

/**
 * Job detail response schema
 */
export const jobDetailResponseSchema = z.object({
  job: jobSchema,
});

/**
 * Repository list response schema
 */
export const repositoryListResponseSchema = z.object({
  repositories: z.array(repositorySchema),
  total: z.number().int().nonnegative(),
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

/**
 * Claude response schema
 */
export const claudeResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  role: z.string(),
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string(),
    })
  ),
});

/**
 * Claude thread schema
 */
export const claudeThreadSchema = z.object({
  id: z.string(),
  messages: z.array(claudeResponseSchema),
});

/**
 * GitHub client config schema
 */
export const githubClientConfigSchema = z.object({
  token: z.string(),
  allowedRepositories: z.array(z.string()),
  baseUrl: z.string().url().optional(),
  tempDir: z.string().optional(),
});

/**
 * Claude client config schema
 */
export const claudeClientConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

/**
 * API config schema
 */
export const apiConfigSchema = z.object({
  port: z.number().int().positive(),
  environment: z.enum(['development', 'production', 'test']),
  dynamoDb: z.object({
    region: z.string(),
    endpoint: z.string().url().optional(),
    tablePrefix: z.string(),
  }),
  github: githubClientConfigSchema,
  claude: claudeClientConfigSchema,
});

/**
 * Batch config schema
 */
export const batchConfigSchema = z.object({
  jobQueue: z.string(),
  jobDefinition: z.string(),
  region: z.string(),
  dynamoDb: z.object({
    region: z.string(),
    endpoint: z.string().url().optional(),
    tablePrefix: z.string(),
  }),
  github: githubClientConfigSchema,
  claude: claudeClientConfigSchema,
});