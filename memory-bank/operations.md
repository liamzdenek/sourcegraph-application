# Operations: Cody Batch

## Deployed Resource Names

As the project is in the planning phase, resources have not been deployed yet. This document will be updated with actual resource names after deployment. The following naming conventions will be used:

### AWS Resources

| Resource Type | Naming Convention | Example |
|---------------|-------------------|---------|
| DynamoDB Tables | `cody-batch-{environment}-{table-name}` | `cody-batch-dev-jobs` |
| Lambda Functions | `cody-batch-{environment}-{function-name}` | `cody-batch-dev-api` |
| AWS Batch Compute Environment | `cody-batch-{environment}-compute` | `cody-batch-dev-compute` |
| AWS Batch Job Queue | `cody-batch-{environment}-job-queue` | `cody-batch-dev-job-queue` |
| AWS Batch Job Definition | `cody-batch-{environment}-job-definition` | `cody-batch-dev-job-definition` |
| S3 Buckets | `cody-batch-{environment}-{bucket-purpose}` | `cody-batch-dev-frontend` |
| CloudFront Distributions | `cody-batch-{environment}-cf` | `cody-batch-dev-cf` |
| API Gateway | `cody-batch-{environment}-api` | `cody-batch-dev-api` |
| IAM Roles | `cody-batch-{environment}-{service}-role` | `cody-batch-dev-lambda-role` |

### Environments

- `dev`: Development environment
- `prod`: Production environment

## Relationship to Source Code

| AWS Resource | Source Code Package | Description |
|--------------|---------------------|-------------|
| API Lambda | `packages/api` | Express API for job management |
| AWS Batch Job | `packages/batch` | Job processing container |
| DynamoDB Tables | Defined in `packages/cdk` | Data storage |
| S3 Frontend Bucket | `packages/frontend` build output | Static website hosting |
| CloudFront Distribution | Configured in `packages/cdk` | Content delivery |
| API Gateway | Configured in `packages/cdk` | API routing |

## How to Operate the System

### Deployment

#### Initial Deployment

```bash
# Install dependencies
npm install

# Build all packages
nx run-many --target=build --all

# Build Docker image for batch job
nx run batch:docker-build

# Push Docker image to ECR
nx run batch:docker-push

# Deploy infrastructure
nx run cdk:deploy
```

#### Frontend Updates

```bash
# Build frontend
nx run frontend:build

# Deploy to S3 (using BucketDeployment in CDK)
nx run cdk:deploy-frontend
```

#### Backend Updates

```bash
# Build API
nx run api:build

# Deploy Lambda function
nx run cdk:deploy-backend
```

#### Batch Job Updates

```bash
# Build batch job
nx run batch:build

# Build and push Docker image
nx run batch:docker-build
nx run batch:docker-push

# Update job definition
nx run cdk:deploy-batch
```

### Monitoring

#### CloudWatch Logs

- **API Lambda Logs**: `/aws/lambda/cody-batch-{environment}-api`
- **Batch Job Logs**: `/aws/batch/job`

```bash
# View API logs
aws logs tail /aws/lambda/cody-batch-dev-api --follow

# View Batch job logs (requires job ID)
aws logs tail /aws/batch/job/job-id-from-aws-batch --follow
```

#### CloudWatch Metrics

Important metrics to monitor:

- Lambda invocations and errors
- AWS Batch job successes and failures
- API Gateway requests and latency
- DynamoDB read/write capacity
- CloudFront requests and cache hit ratio

#### AWS Batch Job Monitoring

```bash
# List all jobs
aws batch list-jobs --job-queue cody-batch-dev-job-queue --status RUNNING

# Describe a specific job
aws batch describe-jobs --jobs job-id-from-aws-batch
```

### Database Operations

#### Viewing Job Data

```bash
# List all jobs
aws dynamodb scan --table-name cody-batch-dev-jobs

# Get specific job
aws dynamodb get-item --table-name cody-batch-dev-jobs \
  --key '{"jobId": {"S": "job-123"}}'
```

#### Viewing Repository Results

```bash
# List all repositories for a job
aws dynamodb query --table-name cody-batch-dev-repositories \
  --key-condition-expression "jobId = :jobId" \
  --expression-attribute-values '{":jobId": {"S": "job-123"}}'

# Get specific repository result
aws dynamodb get-item --table-name cody-batch-dev-repositories \
  --key '{"jobId": {"S": "job-123"}, "repositoryName": {"S": "liamzdenek/repo1"}}'
```

#### Updating Job Status (Manual Override)

```bash
# Update job status
aws dynamodb update-item --table-name cody-batch-dev-jobs \
  --key '{"jobId": {"S": "job-123"}}' \
  --update-expression "SET #status = :status" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":status": {"S": "FAILED"}}'
```

### AWS Batch Operations

#### Submitting a Job Manually

```bash
# Submit a job to AWS Batch
aws batch submit-job \
  --job-name "manual-job-123" \
  --job-queue cody-batch-dev-job-queue \
  --job-definition cody-batch-dev-job-definition \
  --container-overrides '{"environment": [{"name": "JOB_ID", "value": "job-123"}]}'
```

#### Cancelling a Running Job

```bash
# Cancel a running batch job
aws batch cancel-job \
  --job-id job-id-from-aws-batch \
  --reason "Manual cancellation"
```

#### Viewing Compute Environment Status

```bash
# Describe compute environment
aws batch describe-compute-environments \
  --compute-environments cody-batch-dev-compute
```

### Troubleshooting

#### API Issues

1. Check API Gateway logs for request/response issues
2. Verify Lambda execution logs for errors
3. Confirm API Lambda has correct permissions
4. Check DynamoDB access and capacity

```bash
# Test API endpoint
curl -v https://api.example.com/health
```

#### Batch Job Issues

1. Check AWS Batch job status and logs
2. Verify container image is correct
3. Check GitHub API access and rate limits
4. Check Claude API access and token usage
5. Confirm DynamoDB write permissions

```bash
# Check job status
aws batch describe-jobs --jobs job-id-from-aws-batch

# Check container logs
aws logs tail /aws/batch/job/job-id-from-aws-batch --follow
```

#### Frontend Issues

1. Check CloudFront distribution status
2. Verify S3 bucket permissions
3. Check browser console for JavaScript errors
4. Confirm API endpoints are accessible from frontend

```bash
# Test CloudFront distribution
curl -v https://d123456abcdef.cloudfront.net/
```

### Scaling Considerations

- **API Lambda Concurrency**: Default is unrestricted, but consider setting limits for cost control
- **AWS Batch Compute Environment**: Configure min/max vCPUs based on expected workload
- **DynamoDB Capacity**: Start with on-demand capacity, monitor usage patterns
- **API Gateway Throttling**: Default is 10,000 requests per second, adjust as needed
- **Claude API Usage**: Monitor token usage and implement rate limiting if necessary

### Backup and Recovery

- **DynamoDB**: Enable point-in-time recovery for all tables
- **Configuration**: Store CDK state in version control
- **Deployment Artifacts**: Maintain versioned builds
- **Docker Images**: Tag and version container images

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name cody-batch-dev-jobs \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Security Operations

#### Rotating Credentials

- **GitHub Token**: Update in environment variables
- **Claude API Key**: Update in environment variables

```bash
# Update environment variables for API Lambda
aws lambda update-function-configuration \
  --function-name cody-batch-dev-api \
  --environment "Variables={GITHUB_TOKEN=new-token,CLAUDE_API_KEY=new-key}"

# Update environment variables for Batch job definition
aws batch register-job-definition \
  --job-definition-name cody-batch-dev-job-definition \
  --type container \
  --container-properties file://container-properties.json
```

#### Monitoring for Security Issues

- Enable CloudTrail for API activity monitoring
- Set up CloudWatch Alarms for unusual activity
- Regularly review IAM permissions for least privilege

### Cost Management

- Monitor Lambda execution duration and memory usage
- Track AWS Batch compute resource usage
- Monitor DynamoDB read/write capacity consumption
- Watch Claude API token usage
- Set up AWS Budgets for cost alerts

```bash
# Create budget alert
aws budgets create-budget --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## Common Operations

### Viewing Job Status

```bash
# API endpoint
curl -v https://api.example.com/jobs/job-123

# DynamoDB
aws dynamodb get-item --table-name cody-batch-dev-jobs \
  --key '{"jobId": {"S": "job-123"}}'
```

### Downloading Patch Files

Patch files can be downloaded from the frontend UI or directly from the API:

```bash
# API endpoint
curl -v https://api.example.com/jobs/job-123/repositories/liamzdenek%2Frepo1/diff > patch.diff
```

### Viewing Claude Message Threads

Claude message threads can be viewed from the frontend UI or directly from the API:

```bash
# API endpoint
curl -v https://api.example.com/jobs/job-123/repositories/liamzdenek%2Frepo1/claude-thread
```

### Creating a New Job

```bash
# API endpoint
curl -v https://api.example.com/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Update code patterns",
    "description": "Apply a specific code change across repositories",
    "type": "code-pattern-update",
    "prompt": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of '\''oldFunction(param)'\'' with '\''newFunction(param, { version: 2 })'\''.",
    "repositories": [
      "liamzdenek/repo1",
      "liamzdenek/repo2"
    ],
    "createPullRequests": true
  }'
```

### Cancelling a Job

```bash
# API endpoint
curl -v -X POST https://api.example.com/jobs/job-123/cancel

# AWS Batch (if job is running)
aws batch cancel-job \
  --job-id job-id-from-aws-batch \
  --reason "User requested cancellation"