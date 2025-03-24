import { JobProcessor } from './lib/job-processor';
import { getConfig, validateConfig } from './lib/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create a test job in DynamoDB
 * @param jobId Job ID
 * @param prompt Prompt
 * @param repositories Repository names
 */
async function createTestJob(
  jobId: string,
  prompt: string,
  repositories: string[]
) {
  // This is a placeholder for creating a test job
  // In a real implementation, this would create a job in DynamoDB
  console.log(`Creating test job ${jobId} with prompt: ${prompt}`);
  console.log(`Repositories: ${repositories.join(', ')}`);

  // Create a JSON file with the job details
  const jobData = {
    jobId,
    prompt,
    repositories,
    createdAt: new Date().toISOString(),
  };

  // Write job data to file
  fs.writeFileSync(
    path.join(__dirname, '..', '..', '..', `test-job-${jobId}.json`),
    JSON.stringify(jobData, null, 2)
  );
}

/**
 * Main entry point for the test batch processor
 */
async function main() {
  try {
    console.log('Starting Cody Batch test processor');

    // Create a test job
    const jobId = `test-job-${Date.now()}`;
    const prompt = 'Analyze the code and identify any security vulnerabilities. If found, fix them and explain the changes.';
    const repositories = ['liamzdenek/vulnerable-log4j-sample'];

    // Create test job
    await createTestJob(jobId, prompt, repositories);

    // Get configuration
    const config = getConfig();

    // Validate configuration
    validateConfig(config);

    // Create job processor
    const jobProcessor = new JobProcessor(config);

    // Process job
    console.log(`Processing job ${jobId} with max 5 repositories`);
    const result = await jobProcessor.processJob(jobId, 5);

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