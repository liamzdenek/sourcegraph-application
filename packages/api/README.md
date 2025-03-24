# Cody Batch API

The API package provides the HTTP endpoints for the Cody Batch system. It handles job creation, monitoring, and result retrieval.

## Architecture

The API is built with Express.js and can run in two modes:
1. As a standalone server for local development
2. As an AWS Lambda function for production

## Endpoints

### Health Check
- `GET /health`: Check API health status

### Repositories
- `GET /repositories`: List available repositories

### Jobs
- `POST /jobs`: Create a new job
- `GET /jobs`: List all jobs
- `GET /jobs/:jobId`: Get job details
- `POST /jobs/:jobId/cancel`: Cancel a job
- `GET /jobs/:jobId/repositories/:repoName`: Get repository job result
- `GET /jobs/:jobId/repositories/:repoName/diff`: Get repository diff
- `GET /jobs/:jobId/repositories/:repoName/claude-thread`: Get Claude message thread

## Environment Variables

The API requires the following environment variables:

```
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# DynamoDB Configuration
DYNAMODB_JOBS_TABLE=cody-batch-dev-jobs
DYNAMODB_REPOSITORIES_TABLE=cody-batch-dev-repositories

# AWS Batch Configuration
AWS_BATCH_JOB_QUEUE=cody-batch-job-queue
AWS_BATCH_JOB_DEFINITION=cody-batch-job-definition

# GitHub Configuration
GITHUB_TOKEN=your_github_token
ALLOWED_REPOSITORIES=liamzdenek/*

# Claude Configuration
CLAUDE_API_KEY=your_claude_api_key

# API Configuration
PORT=3000
NODE_ENV=development
```

## DynamoDB Schema

The API interacts with two DynamoDB tables:

### Jobs Table

**Table Name**: `cody-batch-{environment}-jobs`

**Primary Key**:
- Partition Key: `jobId` (String)

**GSI**:
- GSI1: `status-createdAt-index`
  - Partition Key: `status`
  - Sort Key: `createdAt`

### Repositories Table

**Table Name**: `cody-batch-{environment}-repositories`

**Primary Key**:
- Partition Key: `jobId` (String)
- Sort Key: `repositoryName` (String)

**GSI**:
- GSI1: `status-startedAt-index`
  - Partition Key: `status`
  - Sort Key: `startedAt`

## AWS Batch Integration

The API submits jobs to AWS Batch for processing. Each job is submitted with the following parameters:

- `jobId`: The unique identifier for the job
- `maxRepositories`: The maximum number of repositories to process (default: 5)

## Local Development

To run the API locally:

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file with your credentials
nano .env

# Start the API
nx run api:serve
```

## Deployment

The API is deployed as an AWS Lambda function. The deployment is handled by the CDK package.

```bash
# Build the API
nx run api:build:production

# Deploy the API (via CDK)
nx run cdk:deploy
```

## Error Handling

The API includes comprehensive error handling:

- Validation errors: 400 Bad Request
- Not found errors: 404 Not Found
- Server errors: 500 Internal Server Error

All errors include a descriptive message and, where applicable, additional details.

## Logging

The API logs all operations to CloudWatch Logs in production. In development mode, logs are output to the console.