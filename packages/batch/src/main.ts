import { JobProcessor } from './lib/job-processor';
import { getConfig, validateConfig } from './lib/config';
import { AwsBatchClient } from './lib/aws-batch-client';

/**
 * Main entry point for the batch processor
 */
async function main() {
  try {
    console.log('Starting Cody Batch processor');
    
    // Log all environment variables for debugging
    console.log('Environment variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('DYNAMODB_JOBS_TABLE:', process.env.DYNAMODB_JOBS_TABLE);
    console.log('DYNAMODB_REPOSITORIES_TABLE:', process.env.DYNAMODB_REPOSITORIES_TABLE);
    console.log('GITHUB_TOKEN length:', process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0);
    console.log('CLAUDE_API_KEY length:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0);
    console.log('ALLOWED_REPOSITORIES:', process.env.ALLOWED_REPOSITORIES);
    
    // Log AWS Batch job information
    console.log('AWS Batch job information:');
    console.log('AWS_BATCH_JOB_ID:', process.env.AWS_BATCH_JOB_ID);
    console.log('AWS_BATCH_JOB_ATTEMPT:', process.env.AWS_BATCH_JOB_ATTEMPT);
    console.log('AWS_BATCH_JOB_QUEUE:', process.env.AWS_BATCH_JOB_QUEUE);
    
    // Get AWS Batch job ID from environment variables
    const awsBatchJobId = process.env.AWS_BATCH_JOB_ID;
    let jobId: string;
    let maxRepositories: number;
    
    // Try to get job parameters from AWS Batch first
    if (awsBatchJobId) {
      try {
        console.log('Initializing AWS Batch client...');
        const awsBatchClient = new AwsBatchClient();
        
        // Get job parameters from AWS Batch
        console.log(`Getting job parameters from AWS Batch for job ID: ${awsBatchJobId}`);
        const jobParameters = await awsBatchClient.getJobParameters(awsBatchJobId);
        
        // Extract job ID and max repositories from job parameters
        jobId = jobParameters.jobId;
        maxRepositories = parseInt(jobParameters.maxRepositories);
        
        console.log(`Successfully retrieved parameters from AWS Batch`);
        console.log(`Using jobId: ${jobId}`);
        console.log(`Using maxRepositories: ${maxRepositories}`);
      } catch (error) {
        console.error(`Error getting job parameters from AWS Batch:`, error);
        console.log('Falling back to environment variables for job parameters');
        
        // Fall back to environment variables
        jobId = process.env.jobId;
        maxRepositories = process.env.maxRepositories ? parseInt(process.env.maxRepositories) : 5;
        
        if (!jobId) {
          console.error('Job ID is required');
          console.error('Available environment variables:', Object.keys(process.env).join(', '));
          process.exit(1);
        }
        
        console.log(`Using jobId from environment: ${jobId}`);
        console.log(`Using maxRepositories from environment: ${maxRepositories}`);
      }
    } else {
      console.log('AWS_BATCH_JOB_ID not found, using environment variables for job parameters');
      
      // Use environment variables
      jobId = process.env.jobId;
      maxRepositories = process.env.maxRepositories ? parseInt(process.env.maxRepositories) : 5;
      
      if (!jobId) {
        console.error('Job ID is required');
        console.error('Available environment variables:', Object.keys(process.env).join(', '));
        process.exit(1);
      }
      
      console.log(`Using jobId from environment: ${jobId}`);
      console.log(`Using maxRepositories from environment: ${maxRepositories}`);
    }

    // Get configuration
    console.log('Loading configuration...');
    const config = getConfig();
    console.log('Configuration loaded successfully');

    // Validate configuration
    console.log('Validating configuration...');
    validateConfig(config);
    console.log('Configuration validated successfully');

    // Create job processor
    console.log('Initializing job processor...');
    const jobProcessor = new JobProcessor(config);
    console.log('Job processor initialized successfully');

    // Process job
    console.log(`Processing job ${jobId} with max ${maxRepositories} repositories`);
    console.log(`Start time: ${new Date().toISOString()}`);
    
    try {
      const result = await jobProcessor.processJob(jobId, maxRepositories);
      
      // Log result
      console.log(`End time: ${new Date().toISOString()}`);
      console.log('Job processing completed');
      console.log('Job result details:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Repositories processed: ${result.repositoriesProcessed}`);
      console.log(`  Repositories with changes: ${result.repositoriesWithChanges}`);
      console.log(`  Repositories with errors: ${result.repositoriesWithErrors}`);
      
      if (result.repositoriesWithErrors > 0 && result.errors) {
        console.log('Repository errors:');
        result.errors.forEach((error, index) => {
          console.log(`  Error ${index + 1}: Repository: ${error.repository}, Error: ${error.message}`);
        });
      }
      
      // Exit with success
      console.log('Exiting with success status');
      process.exit(0);
    } catch (jobError) {
      console.error(`Job processing error at ${new Date().toISOString()}:`, jobError);
      throw jobError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    // Log error with more details
    console.error('Error processing job:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });

    // Exit with error
    console.error('Exiting with error status');
    process.exit(1);
  }
}

// Log startup information
console.log(`Batch processor starting at ${new Date().toISOString()}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Process ID: ${process.pid}`);
console.log(`Working directory: ${process.cwd()}`);

// Run main function
main().catch((error) => {
  console.error(`Unhandled error at ${new Date().toISOString()}:`, error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  console.error('Process will exit with error status');
  process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log(`SIGTERM received at ${new Date().toISOString()}, shutting down gracefully`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`SIGINT received at ${new Date().toISOString()}, shutting down gracefully`);
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception at ${new Date().toISOString()}:`, error);
  console.error('Process will exit with error status');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled rejection at ${new Date().toISOString()}:`, reason);
  console.error('Process will exit with error status');
  process.exit(1);
});
