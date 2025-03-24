import { GitHubClient } from 'github-client';
import { ClaudeClient } from 'claude-client';
import { DynamoDBService } from './dynamodb-client';
import { RepositoryProcessor } from './repository-processor';
import { BatchConfig, JobStatus } from 'shared';

/**
 * Job processor for handling batch jobs
 */
export class JobProcessor {
  private githubClient: GitHubClient;
  private claudeClient: ClaudeClient;
  private dynamoDBService: DynamoDBService;
  private repositoryProcessor: RepositoryProcessor;
  private config: BatchConfig;

  /**
   * Create a new job processor
   * @param config Batch configuration
   */
  constructor(config: BatchConfig) {
    this.config = config;
    
    // Initialize clients
    this.githubClient = new GitHubClient(config.github);
    this.claudeClient = new ClaudeClient(config.claude);
    this.dynamoDBService = new DynamoDBService(config);
    
    // Initialize repository processor
    this.repositoryProcessor = new RepositoryProcessor(
      this.githubClient,
      this.claudeClient,
      this.dynamoDBService
    );
  }

  /**
   * Process a job
   * @param jobId Job ID
   * @param maxRepositories Maximum number of repositories to process
   * @returns Processing result
   */
  async processJob(
    jobId: string,
    maxRepositories: number = 5
  ): Promise<{
    success: boolean;
    repositoriesProcessed: number;
    repositoriesWithChanges: number;
    repositoriesWithErrors: number;
  }> {
    console.log(`Processing job ${jobId}`);

    try {
      // Get job details
      const job = await this.dynamoDBService.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status to processing
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.PROCESSING, {
        startedAt: new Date().toISOString(),
      });

      // Get repositories for job
      const repositories = await this.dynamoDBService.getRepositoriesForJob(jobId);
      
      // Limit repositories to maxRepositories
      const repositoriesToProcess = repositories.slice(0, maxRepositories);
      
      console.log(`Processing ${repositoriesToProcess.length} repositories for job ${jobId}`);

      // Process repositories in parallel with concurrency limit
      const concurrencyLimit = 3; // Process up to 3 repositories at a time
      const results = [];
      
      // Process repositories in batches
      for (let i = 0; i < repositoriesToProcess.length; i += concurrencyLimit) {
        const batch = repositoriesToProcess.slice(i, i + concurrencyLimit);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map((repository) =>
            this.repositoryProcessor.processRepository(
              jobId,
              repository.fullName, // Use fullName instead of repositoryName
              job.prompt,
              true // Always create pull requests for now
            )
          )
        );
        
        results.push(...batchResults);
      }

      // Count results
      const repositoriesWithChanges = results.filter(
        (result) => result.status === 'fulfilled' && result.value.wereChangesNecessary
      ).length;
      
      const repositoriesWithErrors = results.filter(
        (result) => result.status === 'rejected'
      ).length;

      // Update job status to completed
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.COMPLETED, {
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        repositoriesProcessed: repositoriesToProcess.length,
        repositoriesWithChanges,
        repositoriesWithErrors,
      };
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);

      // Update job status to failed
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.FAILED, {
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        repositoriesProcessed: 0,
        repositoriesWithChanges: 0,
        repositoriesWithErrors: 1,
      };
    } finally {
      // Clean up
      try {
        this.githubClient.cleanup();
      } catch (error) {
        console.error('Error cleaning up GitHub client:', error);
      }
    }
  }
}