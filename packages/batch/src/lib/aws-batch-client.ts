import { BatchClient, DescribeJobsCommand } from '@aws-sdk/client-batch';

/**
 * AWS Batch client for interacting with AWS Batch
 */
export class AwsBatchClient {
  private batchClient: BatchClient;

  /**
   * Create a new AWS Batch client
   * @param region AWS region
   */
  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.batchClient = new BatchClient({ region });
  }

  /**
   * Get job details from AWS Batch
   * @param awsBatchJobId AWS Batch job ID
   * @returns Job details
   */
  async getJobDetails(awsBatchJobId: string): Promise<any> {
    console.log(`Getting job details for AWS Batch job ID: ${awsBatchJobId}`);
    
    try {
      const command = new DescribeJobsCommand({
        jobs: [awsBatchJobId]
      });
      
      const response = await this.batchClient.send(command);
      
      if (!response.jobs || response.jobs.length === 0) {
        throw new Error(`Job not found: ${awsBatchJobId}`);
      }
      
      const job = response.jobs[0];
      console.log(`Job details retrieved successfully for job: ${awsBatchJobId}`);
      
      return job;
    } catch (error) {
      console.error(`Error getting job details for AWS Batch job ID ${awsBatchJobId}:`, error);
      throw error;
    }
  }

  /**
   * Get job parameters from AWS Batch
   * @param awsBatchJobId AWS Batch job ID
   * @returns Job parameters
   */
  async getJobParameters(awsBatchJobId: string): Promise<{ jobId: string; maxRepositories: string }> {
    console.log(`Getting job parameters for AWS Batch job ID: ${awsBatchJobId}`);
    
    try {
      const job = await this.getJobDetails(awsBatchJobId);
      
      console.log(`Job details:`, JSON.stringify({
        jobId: job.jobId,
        jobName: job.jobName,
        status: job.status,
        parameters: job.parameters
      }, null, 2));
      
      if (!job.parameters) {
        console.warn(`No parameters found for job: ${awsBatchJobId}, checking environment variables`);
        
        // Try to get parameters from environment variables
        const jobId = process.env.jobId;
        const maxRepositories = process.env.maxRepositories || '5';
        
        if (!jobId) {
          throw new Error(`jobId parameter not found for job: ${awsBatchJobId} and not in environment variables`);
        }
        
        console.log(`Using parameters from environment variables: jobId=${jobId}, maxRepositories=${maxRepositories}`);
        
        return {
          jobId,
          maxRepositories
        };
      }
      
      const { jobId, maxRepositories } = job.parameters;
      
      if (!jobId) {
        console.warn(`jobId parameter not found for job: ${awsBatchJobId}, checking environment variables`);
        
        // Try to get jobId from environment variables
        const envJobId = process.env.jobId;
        
        if (!envJobId) {
          throw new Error(`jobId parameter not found for job: ${awsBatchJobId} and not in environment variables`);
        }
        
        console.log(`Using jobId from environment variables: ${envJobId}`);
        
        return {
          jobId: envJobId,
          maxRepositories: maxRepositories || '5'
        };
      }
      
      console.log(`Job parameters retrieved successfully: jobId=${jobId}, maxRepositories=${maxRepositories || '5'}`);
      
      return {
        jobId,
        maxRepositories: maxRepositories || '5'
      };
    } catch (error) {
      console.error(`Error getting job parameters for AWS Batch job ID ${awsBatchJobId}:`, error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Try to get parameters from environment variables as a fallback
      console.log('Attempting to get parameters from environment variables as fallback');
      
      const jobId = process.env.jobId;
      const maxRepositories = process.env.maxRepositories || '5';
      
      if (jobId) {
        console.log(`Using parameters from environment variables: jobId=${jobId}, maxRepositories=${maxRepositories}`);
        
        return {
          jobId,
          maxRepositories
        };
      }
      
      // If we can't get parameters from environment variables either, rethrow the error
      throw error;
    }
  }
}