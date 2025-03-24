# Runbook: Cody Batch

This runbook provides procedures for common operational tasks and troubleshooting scenarios for the Cody Batch system. It follows the Validate, Triage, Act, Reflect (VTAR) methodology for incident response.

## Deployment Procedures

### Initial Deployment

#### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Nx CLI installed globally (`npm install -g nx`)
- Docker installed and configured
- GitHub service account token
- Claude API key obtained

#### Procedure
1. Clone the repository
   ```bash
   git clone https://github.com/liamzdenek/cody-batch.git
   cd cody-batch
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   # Create .env file with required variables
   cat > .env << EOF
   GITHUB_TOKEN=your_github_token
   CLAUDE_API_KEY=your_claude_api_key
   AWS_REGION=us-east-1
   ALLOWED_REPOSITORIES=liamzdenek/*
   EOF
   ```

4. Build all packages
   ```bash
   nx run-many --target=build --all
   ```

5. Build and push Docker image for batch job
   ```bash
   nx run batch:docker-build
   nx run batch:docker-push
   ```

6. Deploy infrastructure
   ```bash
   nx run cdk:deploy
   ```

7. Verify deployment
   ```bash
   # Check if API is accessible
   curl https://api-url/health
   
   # Check if frontend is accessible
   curl https://frontend-url/
   ```

### Frontend Updates

#### Procedure
1. Make changes to frontend code

2. Build frontend
   ```bash
   nx run frontend:build
   ```

3. Deploy to S3 (using BucketDeployment in CDK)
   ```bash
   nx run cdk:deploy-frontend
   ```

### Backend Updates

#### Procedure
1. Make changes to API code

2. Build API
   ```bash
   nx run api:build
   ```

3. Deploy Lambda function
   ```bash
   nx run cdk:deploy-backend
   ```

4. Verify deployment
   ```bash
   # Check API health
   curl https://api-url/health
   ```

### Batch Job Updates

#### Procedure
1. Make changes to batch job code

2. Build batch job
   ```bash
   nx run batch:build
   ```

3. Build and push Docker image
   ```bash
   nx run batch:docker-build
   nx run batch:docker-push
   ```

4. Update job definition
   ```bash
   nx run cdk:deploy-batch
   ```

5. Verify deployment
   ```bash
   # Submit a test job through the API
   curl -v https://api-url/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Job",
       "type": "code-pattern-update",
       "prompt": "Test prompt",
       "repositories": ["liamzdenek/test-repo"],
       "createPullRequests": false
     }'
   ```

## Monitoring Procedures

### Health Check Monitoring

#### Procedure
1. Set up CloudWatch Alarm for API health endpoint
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "CodyBatchAPIHealth" \
     --metric-name "5XXError" \
     --namespace "AWS/ApiGateway" \
     --statistic "Sum" \
     --period 60 \
     --threshold 1 \
     --comparison-operator "GreaterThanOrEqualToThreshold" \
     --evaluation-periods 1 \
     --alarm-actions "arn:aws:sns:us-east-1:123456789012:alerts" \
     --dimensions "Name=ApiName,Value=cody-batch-api"
   ```

2. Set up synthetic canary for frontend
   ```bash
   # Using CloudWatch Synthetics
   aws synthetics create-canary \
     --name cody-batch-frontend-canary \
     --artifact-s3-location "s3://cody-batch-monitoring/canary-artifacts" \
     --execution-role-arn "arn:aws:iam::123456789012:role/canary-execution-role" \
     --schedule "Expression='rate(5 minutes)'" \
     --run-config "TimeoutInSeconds=30" \
     --code "Handler=index.handler,S3Bucket=cody-batch-monitoring,S3Key=canary-code.zip" \
     --start
   ```

3. Set up AWS Batch job monitoring
   ```bash
   # Create CloudWatch alarm for failed jobs
   aws cloudwatch put-metric-alarm \
     --alarm-name "CodyBatchJobFailures" \
     --metric-name "FailedJobsCount" \
     --namespace "AWS/Batch" \
     --statistic "Sum" \
     --period 300 \
     --threshold 1 \
     --comparison-operator "GreaterThanOrEqualToThreshold" \
     --evaluation-periods 1 \
     --alarm-actions "arn:aws:sns:us-east-1:123456789012:alerts" \
     --dimensions "Name=JobQueue,Value=cody-batch-job-queue"
   ```

### Performance Monitoring

#### Procedure
1. Set up CloudWatch Dashboard
   ```bash
   aws cloudwatch put-dashboard \
     --dashboard-name "CodyBatchDashboard" \
     --dashboard-body file://dashboard.json
   ```

2. Key metrics to monitor:
   - API Gateway latency and request count
   - Lambda duration, invocations, and errors
   - AWS Batch job successes and failures
   - DynamoDB consumed capacity
   - CloudFront request count and cache hit ratio
   - Claude API token usage

3. Set up alarms for critical thresholds
   ```bash
   # Example: AWS Batch compute capacity alarm
   aws cloudwatch put-metric-alarm \
     --alarm-name "CodyBatchComputeCapacity" \
     --metric-name "CPUUtilization" \
     --namespace "AWS/EC2" \
     --statistic "Average" \
     --period 300 \
     --threshold 80 \
     --comparison-operator "GreaterThanOrEqualToThreshold" \
     --evaluation-periods 3 \
     --alarm-actions "arn:aws:sns:us-east-1:123456789012:alerts" \
     --dimensions "Name=AutoScalingGroupName,Value=AmazonECS-cody-batch-compute"
   ```

### Log Monitoring

#### Procedure
1. Set up CloudWatch Logs Insights queries
   ```bash
   # Example: Error rate query
   aws logs start-query \
     --log-group-names "/aws/lambda/cody-batch-api" "/aws/batch/job" \
     --start-time $(date -d "1 hour ago" +%s) \
     --end-time $(date +%s) \
     --query-string "fields @timestamp, @message | filter @message like /ERROR/ | stats count(*) as errorCount by bin(1h)"
   ```

2. Set up log-based metrics and alarms
   ```bash
   # Create metric filter
   aws logs put-metric-filter \
     --log-group-name "/aws/batch/job" \
     --filter-name "JobFailures" \
     --filter-pattern "ERROR Job processing failed" \
     --metric-transformations \
       metricName=JobFailures,metricNamespace=CodyBatch,metricValue=1
   
   # Create alarm on metric
   aws cloudwatch put-metric-alarm \
     --alarm-name "CodyBatchJobFailures" \
     --metric-name "JobFailures" \
     --namespace "CodyBatch" \
     --statistic "Sum" \
     --period 300 \
     --threshold 5 \
     --comparison-operator "GreaterThanOrEqualToThreshold" \
     --evaluation-periods 1 \
     --alarm-actions "arn:aws:sns:us-east-1:123456789012:alerts"
   ```

## Troubleshooting Procedures

### API Service Issues

#### Validate
1. Check if the API is responding
   ```bash
   curl -v https://api-url/health
   ```

2. Verify CloudWatch Logs for errors
   ```bash
   aws logs tail /aws/lambda/cody-batch-api --follow
   ```

3. Check API Gateway metrics
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace "AWS/ApiGateway" \
     --metric-name "5XXError" \
     --dimensions "Name=ApiName,Value=cody-batch-api" \
     --start-time $(date -d "1 hour ago" +%s) \
     --end-time $(date +%s) \
     --period 300 \
     --statistics Sum
   ```

#### Triage
1. Determine if the issue is with the API Gateway or Lambda
   - 5XX errors from API Gateway but no Lambda errors: API Gateway issue
   - Lambda execution errors: Lambda issue
   - Lambda timeouts: Code or dependency issue

2. Check Lambda configuration
   ```bash
   aws lambda get-function-configuration --function-name cody-batch-api
   ```

3. Check DynamoDB status
   ```bash
   aws dynamodb describe-table --table-name cody-batch-jobs
   ```

#### Act
1. For API Gateway issues:
   ```bash
   # Redeploy API
   aws apigateway create-deployment \
     --rest-api-id API_ID \
     --stage-name STAGE_NAME
   ```

2. For Lambda issues:
   ```bash
   # Update Lambda configuration if needed
   aws lambda update-function-configuration \
     --function-name cody-batch-api \
     --timeout 30 \
     --memory-size 1024
   
   # Redeploy Lambda if needed
   nx run api:build
   nx run cdk:deploy-backend
   ```

3. For DynamoDB issues:
   ```bash
   # Increase provisioned capacity if needed
   aws dynamodb update-table \
     --table-name cody-batch-jobs \
     --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
   ```

#### Reflect
1. Document the incident
2. Update monitoring if needed
3. Consider code changes to prevent recurrence

### Batch Job Processing Issues

#### Validate
1. Check AWS Batch job status
   ```bash
   # List jobs with a specific status
   aws batch list-jobs --job-queue cody-batch-job-queue --status FAILED
   
   # Describe a specific job
   aws batch describe-jobs --jobs job-id-from-aws-batch
   ```

2. Check CloudWatch Logs for batch job errors
   ```bash
   # Get the log stream name from the job description
   LOG_STREAM=$(aws batch describe-jobs --jobs job-id-from-aws-batch --query 'jobs[0].container.logStreamName' --output text)
   
   # View the logs
   aws logs tail /aws/batch/job --log-stream-name $LOG_STREAM --follow
   ```

3. Verify job status in DynamoDB
   ```bash
   aws dynamodb get-item --table-name cody-batch-jobs \
     --key '{"jobId": {"S": "job-123"}}'
   ```

#### Triage
1. Determine the type of failure:
   - Container issues: Check Docker image and configuration
   - GitHub API issues: Check rate limits and authentication
   - Claude API issues: Check token usage and API status
   - Code analysis issues: Check repository size and complexity
   - Resource issues: Check compute environment capacity

2. Check GitHub API status
   ```bash
   # Use the batch job logs to check GitHub API responses
   # Or make a test request with the service account token
   curl -v https://api.github.com/rate_limit \
     -H "Authorization: token $GITHUB_TOKEN"
   ```

3. Check AWS Batch compute environment
   ```bash
   aws batch describe-compute-environments \
     --compute-environments cody-batch-compute
   ```

#### Act
1. For container issues:
   ```bash
   # Rebuild and push the Docker image
   nx run batch:docker-build
   nx run batch:docker-push
   
   # Update the job definition
   nx run cdk:deploy-batch
   ```

2. For GitHub API issues:
   - Wait for rate limit reset
   - Update GitHub token if needed

3. For Claude API issues:
   - Check Claude API status
   - Update API key if needed

4. For compute environment issues:
   ```bash
   # Update compute environment capacity
   aws batch update-compute-environment \
     --compute-environment cody-batch-compute \
     --compute-resources 'minvCpus=1,maxvCpus=16'
   ```

5. For stuck jobs:
   ```bash
   # Cancel the batch job
   aws batch cancel-job \
     --job-id job-id-from-aws-batch \
     --reason "Job stuck"
   
   # Reset job status in DynamoDB
   aws dynamodb update-item --table-name cody-batch-jobs \
     --key '{"jobId": {"S": "job-123"}}' \
     --update-expression "SET #status = :status" \
     --expression-attribute-names '{"#status": "status"}' \
     --expression-attribute-values '{":status": {"S": "PENDING"}}'
   ```

#### Reflect
1. Document the incident
2. Update job processing logic if needed
3. Consider adding more robust error handling

### Frontend Issues

#### Validate
1. Check if the frontend is accessible
   ```bash
   curl -v https://frontend-url/
   ```

2. Verify CloudFront distribution status
   ```bash
   aws cloudfront get-distribution --id DISTRIBUTION_ID
   ```

3. Check S3 bucket accessibility
   ```bash
   aws s3 ls s3://cody-batch-frontend/
   ```

#### Triage
1. Determine if the issue is with CloudFront, S3, or the application code
   - CloudFront errors: Check distribution configuration
   - S3 access issues: Check bucket permissions
   - Application errors: Check browser console logs

2. Check CloudFront cache status
   ```bash
   aws cloudfront get-distribution-config --id DISTRIBUTION_ID
   ```

3. Check S3 bucket policy
   ```bash
   aws s3api get-bucket-policy --bucket cody-batch-frontend
   ```

#### Act
1. For CloudFront issues:
   ```bash
   # Create invalidation
   aws cloudfront create-invalidation \
     --distribution-id DISTRIBUTION_ID \
     --paths "/*"
   ```

2. For S3 issues:
   ```bash
   # Update bucket policy if needed
   aws s3api put-bucket-policy \
     --bucket cody-batch-frontend \
     --policy file://policy.json
   
   # Redeploy frontend
   nx run frontend:build
   nx run cdk:deploy-frontend
   ```

3. For application code issues:
   - Fix code issues
   - Rebuild and redeploy

#### Reflect
1. Document the incident
2. Update frontend code if needed
3. Consider adding more robust error handling

## Common Error Messages, Root Causes, and Solutions

### API Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "Lambda execution timed out" | API Lambda exceeding 30s timeout | Optimize code or increase timeout |
| "Internal server error" | Unhandled exception in API code | Check logs for stack trace and fix code |
| "Cannot read property of undefined" | Null reference in API code | Add null checks and improve error handling |
| "Access denied" | IAM permissions issue | Check and update Lambda execution role |
| "Connection refused" | DynamoDB connectivity issue | Check VPC configuration and network access |

### Batch Job Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "Container failed to start" | Docker image issue | Check container configuration and rebuild image |
| "GitHub API rate limit exceeded" | Too many GitHub API requests | Implement rate limiting and backoff strategy |
| "Repository not found" | Invalid repository name or access issue | Verify repository exists and check permissions |
| "Claude API error: context length exceeded" | Code too large for Claude context window | Implement chunking strategy for large files |
| "Out of memory" | Container using too much memory | Increase container memory allocation |
| "Job timed out" | Job exceeding time limit | Optimize job processing or increase timeout |

### Frontend Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "API endpoint not found" | Incorrect API URL configuration | Update API URL in frontend config |
| "Failed to fetch" | CORS issues or API unavailable | Check CORS configuration and API status |
| "Cannot read property of undefined" | Null reference in frontend code | Add null checks and improve error handling |
| "ChunkLoadError" | JavaScript bundling issue | Check webpack configuration and rebuild |

## Maintenance Procedures

### Database Maintenance

#### Cleaning Up Old Jobs
```bash
# Identify old jobs (>30 days)
aws dynamodb scan --table-name cody-batch-jobs \
  --filter-expression "createdAt < :threshold" \
  --expression-attribute-values '{":threshold": {"N": "'$(date -d "30 days ago" +%s)'"}}'

# Delete old jobs
# (Use a script to iterate through results and delete items)
```

#### Backup Procedures
```bash
# Create on-demand backup
aws dynamodb create-backup \
  --table-name cody-batch-jobs \
  --backup-name "cody-batch-jobs-$(date +%Y%m%d)"
```

### Log Rotation

CloudWatch Logs are retained according to the configured retention period. To update retention:

```bash
# Set log retention to 30 days
aws logs put-retention-policy \
  --log-group-name "/aws/lambda/cody-batch-api" \
  --retention-in-days 30

# Set batch job log retention
aws logs put-retention-policy \
  --log-group-name "/aws/batch/job" \
  --retention-in-days 30
```

### Security Updates

#### Updating Dependencies
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

#### Rotating Credentials
```bash
# Update GitHub token
# 1. Generate new token in GitHub
# 2. Update environment variables

# Update API Lambda environment
aws lambda update-function-configuration \
  --function-name cody-batch-api \
  --environment "Variables={GITHUB_TOKEN=new-token}"

# Update Batch job definition
aws batch register-job-definition \
  --job-definition-name cody-batch-job-definition \
  --type container \
  --container-properties file://container-properties.json
```

### AWS Batch Maintenance

#### Updating Compute Environment
```bash
# Update compute environment
aws batch update-compute-environment \
  --compute-environment cody-batch-compute \
  --compute-resources 'minvCpus=1,maxvCpus=16,desiredvCpus=2'
```

#### Updating Job Definition
```bash
# Register new job definition
aws batch register-job-definition \
  --job-definition-name cody-batch-job-definition \
  --type container \
  --container-properties file://container-properties.json
```

#### Monitoring Job Queue
```bash
# Check job queue status
aws batch describe-job-queues \
  --job-queues cody-batch-job-queue

# List jobs by status
aws batch list-jobs \
  --job-queue cody-batch-job-queue \
  --job-status RUNNING
```

## Operational Procedures

### Submitting a Test Job
```bash
# Create a test job via API
curl -v https://api-url/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Job",
    "type": "code-pattern-update",
    "prompt": "Test prompt",
    "repositories": ["liamzdenek/test-repo"],
    "createPullRequests": false
  }'
```

### Monitoring Job Progress
```bash
# Check job status in DynamoDB
aws dynamodb get-item --table-name cody-batch-jobs \
  --key '{"jobId": {"S": "job-123"}}'

# Check batch job status
aws batch describe-jobs --jobs job-id-from-aws-batch
```

### Downloading Patch Files
```bash
# Download patch file from API
curl -v https://api-url/jobs/job-123/repositories/liamzdenek%2Frepo1/diff > patch.diff
```

### Viewing Claude Message Threads
```bash
# View Claude message thread from API
curl -v https://api-url/jobs/job-123/repositories/liamzdenek%2Frepo1/claude-thread