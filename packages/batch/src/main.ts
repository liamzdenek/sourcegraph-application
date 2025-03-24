import { JobProcessor } from './lib/job-processor';
import { getConfig, validateConfig } from './lib/config';

/**
 * Main entry point for the batch processor
 */
async function main() {
  try {
    console.log('Starting Cody Batch processor');

    // Get job ID from command line arguments
    const jobId = process.argv[2];
    if (!jobId) {
      console.error('Job ID is required');
      process.exit(1);
    }

    // Get max repositories from command line arguments (default: 5)
    const maxRepositories = process.argv[3] ? parseInt(process.argv[3]) : 5;

    // Get configuration
    const config = getConfig();

    // Validate configuration
    validateConfig(config);

    // Create job processor
    const jobProcessor = new JobProcessor(config);

    // Process job
    console.log(`Processing job ${jobId} with max ${maxRepositories} repositories`);
    const result = await jobProcessor.processJob(jobId, maxRepositories);

    // Log result
    console.log('Job processing completed');
    console.log(`Success: ${result.success}`);
    console.log(`Repositories processed: ${result.repositoriesProcessed}`);
    console.log(`Repositories with changes: ${result.repositoriesWithChanges}`);
    console.log(`Repositories with errors: ${result.repositoriesWithErrors}`);

    // Exit with success
    process.exit(0);
  } catch (error) {
    // Log error
    console.error('Error processing job:', error);

    // Exit with error
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
