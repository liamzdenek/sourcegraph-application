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
    errors?: Array<{repository: string; message: string}>;
  }> {
    console.log(`Processing job ${jobId} with max ${maxRepositories} repositories`);
    console.log(`Job processor start time: ${new Date().toISOString()}`);

    try {
      // Get job details
      console.log(`Fetching job details for job ${jobId}...`);
      const job = await this.dynamoDBService.getJob(jobId);
      if (!job) {
        console.error(`Job ${jobId} not found in DynamoDB`);
        throw new Error(`Job ${jobId} not found`);
      }
      console.log(`Job details retrieved: ${JSON.stringify({
        name: job.name,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
        repositoryCount: job.repositoryCount
      })}`);

      // Update job status to processing
      console.log(`Updating job status to PROCESSING...`);
      const startedAt = new Date().toISOString();
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.PROCESSING, {
        startedAt,
      });
      console.log(`Job status updated to PROCESSING at ${startedAt}`);

      // Get repositories for job
      console.log(`Fetching repositories for job ${jobId}...`);
      const repositories = await this.dynamoDBService.getRepositoriesForJob(jobId);
      console.log(`Retrieved ${repositories.length} repositories for job ${jobId}`);
      
      // Limit repositories to maxRepositories
      const repositoriesToProcess = repositories.slice(0, maxRepositories);
      
      console.log(`Processing ${repositoriesToProcess.length} repositories for job ${jobId} (limited from ${repositories.length})`);
      console.log(`Repositories to process: ${repositoriesToProcess.map(r => r.fullName).join(', ')}`);

      // Process repositories in parallel with concurrency limit
      const concurrencyLimit = 3; // Process up to 3 repositories at a time
      console.log(`Using concurrency limit of ${concurrencyLimit} repositories at a time`);
      
      const results = [];
      const errors = [];
      
      // Process repositories in batches
      for (let i = 0; i < repositoriesToProcess.length; i += concurrencyLimit) {
        const batch = repositoriesToProcess.slice(i, i + concurrencyLimit);
        const batchNumber = Math.floor(i / concurrencyLimit) + 1;
        const totalBatches = Math.ceil(repositoriesToProcess.length / concurrencyLimit);
        
        console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batch.length} repositories`);
        console.log(`Batch ${batchNumber} repositories: ${batch.map(r => r.fullName).join(', ')}`);
        
        // Process batch in parallel
        const batchStartTime = new Date().toISOString();
        console.log(`Batch ${batchNumber} start time: ${batchStartTime}`);
        
        const batchResults = await Promise.allSettled(
          batch.map((repository) => {
            // Get the repository name - could be in fullName or repositoryName field
            // Use type assertion to handle the mismatch between the Repository interface and the actual data
            const repoName = repository.fullName || (repository as any).repositoryName;
            
            if (!repoName) {
              console.error(`Repository name is missing for repository in job ${jobId}:`, repository);
              throw new Error(`Repository name is missing for repository in job ${jobId}`);
            }
            
            console.log(`Starting processing of repository: ${repoName}`);
            return this.repositoryProcessor.processRepository(
              jobId,
              repoName,
              job.prompt,
              false // Disable pull request creation
            );
          })
        );
        
        const batchEndTime = new Date().toISOString();
        console.log(`Batch ${batchNumber} end time: ${batchEndTime}`);
        
        // Log batch results
        batchResults.forEach((result, index) => {
          // Get the repository name - could be in fullName or repositoryName field
          const repoName = batch[index].fullName || (batch[index] as any).repositoryName;
          if (result.status === 'fulfilled') {
            console.log(`Repository ${repoName} processed successfully`);
            console.log(`  Changes necessary: ${result.value.wereChangesNecessary}`);
            console.log(`  Pull request URL: ${result.value.pullRequestUrl || 'N/A'}`);
          } else {
            console.error(`Repository ${repoName} processing failed:`, result.reason);
            errors.push({
              repository: repoName,
              message: result.reason instanceof Error ? result.reason.message : String(result.reason)
            });
          }
        });
        
        results.push(...batchResults);
        console.log(`Completed batch ${batchNumber}/${totalBatches}`);
      }

      // Count results
      const repositoriesWithChanges = results.filter(
        (result) => result.status === 'fulfilled' && result.value.wereChangesNecessary
      ).length;
      
      const repositoriesWithErrors = results.filter(
        (result) => result.status === 'rejected'
      ).length;
      
      console.log(`Job processing summary:`);
      console.log(`  Total repositories processed: ${repositoriesToProcess.length}`);
      console.log(`  Repositories with changes: ${repositoriesWithChanges}`);
      console.log(`  Repositories with errors: ${repositoriesWithErrors}`);
      
      if (repositoriesWithErrors > 0) {
        console.log(`  Error details:`);
        errors.forEach((error, index) => {
          console.log(`    Error ${index + 1}: Repository: ${error.repository}, Error: ${error.message}`);
        });
      }

      // Update job status to completed
      console.log(`Updating job status to COMPLETED...`);
      const completedAt = new Date().toISOString();
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.COMPLETED, {
        completedAt,
      });
      console.log(`Job status updated to COMPLETED at ${completedAt}`);

      return {
        success: true,
        repositoriesProcessed: repositoriesToProcess.length,
        repositoriesWithChanges,
        repositoriesWithErrors,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error(`Error processing job ${jobId} at ${new Date().toISOString()}:`, error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Update job status to failed
      console.log(`Updating job status to FAILED...`);
      const completedAt = new Date().toISOString();
      await this.dynamoDBService.updateJobStatus(jobId, JobStatus.FAILED, {
        completedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`Job status updated to FAILED at ${completedAt}`);

      return {
        success: false,
        repositoriesProcessed: 0,
        repositoriesWithChanges: 0,
        repositoriesWithErrors: 1,
        errors: [{
          repository: 'job-level-error',
          message: error instanceof Error ? error.message : String(error)
        }]
      };
    } finally {
      // Clean up
      console.log(`Running cleanup operations...`);
      try {
        console.log(`Cleaning up GitHub client...`);
        this.githubClient.cleanup();
        console.log(`GitHub client cleanup completed successfully`);
      } catch (error) {
        console.error(`Error cleaning up GitHub client at ${new Date().toISOString()}:`, error);
        console.error('Cleanup error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      console.log(`Job processing completed at ${new Date().toISOString()}`);
    }
  }
}