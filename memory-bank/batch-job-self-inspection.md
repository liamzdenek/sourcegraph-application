# Batch Job Self-Inspection

## Overview

We've updated the batch processor to use AWS Batch API to self-inspect job parameters instead of relying on environment variables. This approach is more reliable and follows AWS best practices.

## Changes Made

1. **Created AWS Batch Client**
   - Added a new `AwsBatchClient` class in `packages/batch/src/lib/aws-batch-client.ts`
   - Implemented methods to get job details and parameters from AWS Batch
   - Added fallback to environment variables if AWS Batch API fails
   - Added detailed error handling and logging

2. **Updated Main Batch Processor**
   - Modified `packages/batch/src/main.ts` to use the AWS Batch client
   - Now retrieves job parameters (jobId, maxRepositories) from AWS Batch API
   - Added fallback mechanism to use environment variables if AWS Batch API fails
   - Added detailed logging for better debugging

3. **Updated CDK Stack**
   - Added IAM permissions for the task execution role to describe AWS Batch jobs
   - Added policy statement with `batch:DescribeJobs` permission
   - Added additional DynamoDB permissions for tables with the prefix `cody-batch-*`
   - Granted full access to the specific DynamoDB tables

4. **Updated DynamoDB Table Name Resolution**
   - Modified `packages/batch/src/lib/config.ts` to use table names from environment variables
   - Added fallback to constructed table names if environment variables are not set
   - Added detailed logging for table name resolution

5. **Disabled Pull Request Creation**
   - Modified the repository processor to skip branch creation
   - Disabled pull request creation logic
   - Still generates and stores diffs in DynamoDB
   - Added more detailed logging throughout the process

## How It Works

1. The batch processor gets the AWS Batch job ID from the `AWS_BATCH_JOB_ID` environment variable
2. It uses the AWS Batch API to retrieve the job details, including parameters
3. The job parameters (jobId, maxRepositories) are extracted from the job details
4. These parameters are then used to process the job as before

## Troubleshooting

If you encounter issues with the batch processor not being able to retrieve job parameters:

1. **Check IAM Permissions**
   - Ensure the task execution role has the `batch:DescribeJobs` permission
   - Ensure the task execution role has the necessary DynamoDB permissions
   - Verify the role ARN in the AWS Batch job definition

2. **Check AWS Batch Job Parameters**
   - Verify that the job was submitted with the correct parameters
   - Check the AWS Batch job details in the AWS console

3. **Check DynamoDB Table Names**
   - Ensure the environment variables `DYNAMODB_JOBS_TABLE` and `DYNAMODB_REPOSITORIES_TABLE` are set correctly
   - Verify that the table names match the actual DynamoDB table names in AWS

4. **Check Logs**
   - Look for detailed logs in CloudWatch
   - The batch processor now logs all environment variables and job parameters
   - Check for specific error messages related to permissions or table names

5. **Common Errors and Solutions**
   - `AccessDeniedException: User is not authorized to perform: dynamodb:GetItem`: Add the necessary DynamoDB permissions to the task execution role
   - `ResourceNotFoundException: Requested resource not found`: Verify that the DynamoDB table names are correct
   - `ValidationException: One or more parameter values were invalid`: Check the format of the parameters being passed to AWS Batch

## Example AWS Batch Job Parameters

When submitting a job to AWS Batch, include these parameters:

```json
{
  "jobId": "job-123456",
  "maxRepositories": "5"
}
```

## Required Environment Variables

The batch processor requires these environment variables:

- `AWS_BATCH_JOB_ID`: The AWS Batch job ID (automatically provided by AWS Batch)
- `AWS_REGION`: The AWS region (e.g., us-east-1)
- `GITHUB_TOKEN`: GitHub API token
- `CLAUDE_API_KEY`: Claude API key
- `DYNAMODB_JOBS_TABLE`: DynamoDB table for jobs
- `DYNAMODB_REPOSITORIES_TABLE`: DynamoDB table for repositories
- `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repositories