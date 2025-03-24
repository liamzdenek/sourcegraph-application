# Cody Batch Processor

The batch processor is responsible for processing jobs that analyze and modify multiple repositories using the Claude client.

## Architecture

The batch processor consists of the following components:

1. **Job Processor**: Main entry point that retrieves job details and orchestrates processing
2. **Repository Processor**: Handles repository cloning, branch creation, and cleanup
3. **DynamoDB Client**: Manages persistent storage of job and repository status
4. **Configuration**: Manages environment variables and configuration

## Usage

### Environment Variables

The batch processor requires the following environment variables:

- `GITHUB_TOKEN`: GitHub service account token
- `CLAUDE_API_KEY`: Claude 3.7 API key
- `DYNAMODB_TABLE_PREFIX`: Prefix for DynamoDB tables (default: "cody-batch")

Optional environment variables:

- `CLAUDE_MODEL`: Claude model to use (default: "claude-3-7-sonnet-20250219")
- `CLAUDE_MAX_TOKENS`: Maximum tokens for Claude responses (default: 64000)
- `CLAUDE_TEMPERATURE`: Temperature for Claude responses (default: 0.5)
- `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repository patterns (default: "liamzdenek/*")
- `DYNAMODB_ENDPOINT`: Custom DynamoDB endpoint for local development
- `DYNAMODB_REGION`: AWS region for DynamoDB (default: AWS_REGION or "us-east-1")
- `AWS_REGION`: AWS region (default: "us-east-1")
- `TEMP_DIR`: Custom temporary directory for cloning repositories

### Running Locally

To run the batch processor locally for testing:

```bash
# Create a .env file with the required environment variables
echo "GITHUB_TOKEN=your_github_token" > .env
echo "CLAUDE_API_KEY=your_claude_api_key" >> .env
echo "DYNAMODB_TABLE_PREFIX=cody-batch-local" >> .env
echo "ALLOWED_REPOSITORIES=liamzdenek/*" >> .env

# Run the test batch processor
nx run batch:serve-test
```

This will:
1. Create a test job with a sample prompt
2. Process the job using the Claude client
3. Generate changes and create pull requests if necessary

### Running in Production

In production, the batch processor is triggered by AWS Batch:

```bash
# Build the batch processor
nx run batch:build:production

# Run the batch processor with a job ID
node dist/packages/batch/main.js job-123 5
```

Where:
- `job-123` is the job ID
- `5` is the maximum number of repositories to process (optional, default: 5)

## Flow

1. **Job Initialization**:
   - Retrieve job details from DynamoDB
   - Update job status to "processing"

2. **Repository Processing**:
   - For each repository (up to the maximum limit):
     - Clone the repository
     - Create a new branch if creating PRs
     - Run Claude analysis
     - Process results (generate diff, create PR)
     - Update repository status

3. **Job Completion**:
   - Update job status to "completed" or "failed"
   - Clean up temporary files

## Error Handling

The batch processor includes comprehensive error handling:

- Repository-level isolation: Each repository is processed independently
- Transaction logging: All operations are logged for debugging
- Status updates: DynamoDB is updated after each significant step
- Cleanup: Temporary directories are removed even on failure

## Testing

To test the batch processor without making actual changes:

1. Modify the `test-batch-processor.ts` file to use a test repository
2. Run the test batch processor with `nx run batch:serve-test`
3. Check the logs for the results

## Monitoring

The batch processor logs all operations to CloudWatch Logs in production. You can monitor the progress of a job by:

1. Checking the job status in DynamoDB
2. Viewing the logs in CloudWatch Logs
3. Checking the repository status in DynamoDB