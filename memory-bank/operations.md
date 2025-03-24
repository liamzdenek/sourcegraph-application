# Operations: Cody Batch

## Deployed Resource Names

As the project is in the planning phase, resources have not been deployed yet. This document will be updated with actual resource names after deployment. The following naming conventions will be used:

### AWS Resources

| Resource Type | Naming Convention | Example |
|---------------|-------------------|---------|
| DynamoDB Tables | `cody-batch-{environment}-{table-name}` | `cody-batch-dev-jobs` |
| Lambda Functions | `cody-batch-{environment}-{function-name}` | `cody-batch-dev-api` |
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
| Worker Lambda | `packages/worker` | Job processing logic |
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

# Deploy infrastructure
nx run cdk:deploy
```

#### Frontend Updates

```bash
# Build frontend
nx run frontend:build

# Deploy to S3
nx run cdk:deploy-frontend
```

#### Backend Updates

```bash
# Build API and Worker
nx run-many --target=build --projects=api,worker

# Deploy Lambda functions
nx run cdk:deploy-backend
```

### Monitoring

#### CloudWatch Logs

- **API Lambda Logs**: `/aws/lambda/cody-batch-{environment}-api`
- **Worker Lambda Logs**: `/aws/lambda/cody-batch-{environment}-worker`

```bash
# View API logs
aws logs tail /aws/lambda/cody-batch-dev-api --follow

# View Worker logs
aws logs tail /aws/lambda/cody-batch-dev-worker --follow
```

#### CloudWatch Metrics

Important metrics to monitor:

- Lambda invocations and errors
- API Gateway requests and latency
- DynamoDB read/write capacity
- CloudFront requests and cache hit ratio

### Database Operations

#### Viewing Job Data

```bash
# List all jobs
aws dynamodb scan --table-name cody-batch-dev-jobs

# Get specific job
aws dynamodb get-item --table-name cody-batch-dev-jobs \
  --key '{"jobId": {"S": "job-123"}}'
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

#### Worker Issues

1. Check Worker Lambda logs for execution errors
2. Verify GitHub API access and rate limits
3. Check Claude API access and token usage
4. Confirm DynamoDB write permissions

```bash
# Manually invoke worker for testing
aws lambda invoke --function-name cody-batch-dev-worker \
  --payload '{"jobId": "job-123"}' output.json
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

- **Lambda Concurrency**: Default is unrestricted, but consider setting limits for cost control
- **DynamoDB Capacity**: Start with on-demand capacity, monitor usage patterns
- **API Gateway Throttling**: Default is 10,000 requests per second, adjust as needed
- **Claude API Usage**: Monitor token usage and implement rate limiting if necessary

### Backup and Recovery

- **DynamoDB**: Enable point-in-time recovery for all tables
- **Configuration**: Store CDK state in version control
- **Deployment Artifacts**: Maintain versioned builds

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name cody-batch-dev-jobs \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Security Operations

#### Rotating Credentials

- **GitHub OAuth**: Update in AWS Secrets Manager
- **Claude API Key**: Update in AWS Secrets Manager

```bash
# Update GitHub OAuth secret
aws secretsmanager update-secret --secret-id cody-batch-dev-github-oauth \
  --secret-string '{"clientId":"new-id","clientSecret":"new-secret"}'

# Update Claude API key
aws secretsmanager update-secret --secret-id cody-batch-dev-claude-api \
  --secret-string '{"apiKey":"new-key"}'
```

#### Monitoring for Security Issues

- Enable CloudTrail for API activity monitoring
- Set up CloudWatch Alarms for unusual activity
- Regularly review IAM permissions for least privilege

### Cost Management

- Monitor Lambda execution duration and memory usage
- Track DynamoDB read/write capacity consumption
- Watch Claude API token usage
- Set up AWS Budgets for cost alerts

```bash
# Create budget alert
aws budgets create-budget --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json