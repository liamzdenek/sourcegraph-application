# Runbook: Cody Batch

This runbook provides procedures for common operational tasks and troubleshooting scenarios for the Cody Batch system. It follows the Validate, Triage, Act, Reflect (VTAR) methodology for incident response.

## Deployment Procedures

### Initial Deployment

#### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Nx CLI installed globally (`npm install -g nx`)
- GitHub OAuth application created
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
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   CLAUDE_API_KEY=your_claude_api_key
   AWS_REGION=us-east-1
   ALLOWED_REPOSITORIES=liamzdenek/*
   EOF
   ```

4. Build all packages
   ```bash
   nx run-many --target=build --all
   ```

5. Deploy infrastructure
   ```bash
   nx run cdk:deploy
   ```

6. Verify deployment
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

3. Deploy to S3
   ```bash
   nx run cdk:deploy-frontend
   ```

4. Invalidate CloudFront cache
   ```bash
   aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
   ```

### Backend Updates

#### Procedure
1. Make changes to API or Worker code

2. Build affected packages
   ```bash
   nx run-many --target=build --projects=api,worker
   ```

3. Deploy Lambda functions
   ```bash
   nx run cdk:deploy-backend
   ```

4. Verify deployment
   ```bash
   # Check API health
   curl https://api-url/health
   
   # Test worker functionality
   # (Create a test job through the API)
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
   - DynamoDB consumed capacity
   - CloudFront request count and cache hit ratio
   - Claude API token usage

3. Set up alarms for critical thresholds
   ```bash
   # Example: Lambda duration alarm
   aws cloudwatch put-metric-alarm \
     --alarm-name "CodyBatchWorkerDuration" \
     --metric-name "Duration" \
     --namespace "AWS/Lambda" \
     --statistic "Maximum" \
     --period 300 \
     --threshold 840000 \
     --comparison-operator "GreaterThanOrEqualToThreshold" \
     --evaluation-periods 1 \
     --alarm-actions "arn:aws:sns:us-east-1:123456789012:alerts" \
     --dimensions "Name=FunctionName,Value=cody-batch-worker"
   ```

### Log Monitoring

#### Procedure
1. Set up CloudWatch Logs Insights queries
   ```bash
   # Example: Error rate query
   aws logs start-query \
     --log-group-names "/aws/lambda/cody-batch-api" "/aws/lambda/cody-batch-worker" \
     --start-time $(date -d "1 hour ago" +%s) \
     --end-time $(date +%s) \
     --query-string "fields @timestamp, @message | filter @message like /ERROR/ | stats count(*) as errorCount by bin(1h)"
   ```

2. Set up log-based metrics and alarms
   ```bash
   # Create metric filter
   aws logs put-metric-filter \
     --log-group-name "/aws/lambda/cody-batch-worker" \
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

### Worker Processing Issues

#### Validate
1. Check CloudWatch Logs for worker errors
   ```bash
   aws logs tail /aws/lambda/cody-batch-worker --follow
   ```

2. Verify job status in DynamoDB
   ```bash
   aws dynamodb get-item --table-name cody-batch-jobs \
     --key '{"jobId": {"S": "job-123"}}'
   ```

3. Check Lambda metrics
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace "AWS/Lambda" \
     --metric-name "Errors" \
     --dimensions "Name=FunctionName,Value=cody-batch-worker" \
     --start-time $(date -d "1 hour ago" +%s) \
     --end-time $(date +%s) \
     --period 300 \
     --statistics Sum
   ```

#### Triage
1. Determine the type of failure:
   - GitHub API issues: Check rate limits and authentication
   - Claude API issues: Check token usage and API status
   - Code analysis issues: Check repository size and complexity
   - Lambda execution issues: Check timeout and memory usage

2. Check GitHub API status
   ```bash
   curl -v https://api.github.com/rate_limit \
     -H "Authorization: token GITHUB_TOKEN"
   ```

3. Check Lambda resource usage
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace "AWS/Lambda" \
     --metric-name "Duration" \
     --dimensions "Name=FunctionName,Value=cody-batch-worker" \
     --start-time $(date -d "1 hour ago" +%s) \
     --end-time $(date +%s) \
     --period 300 \
     --statistics Maximum
   ```

#### Act
1. For GitHub API issues:
   - Wait for rate limit reset
   - Update GitHub token if needed

2. For Claude API issues:
   - Check Claude API status
   - Update API key if needed

3. For Lambda execution issues:
   ```bash
   # Increase Lambda resources
   aws lambda update-function-configuration \
     --function-name cody-batch-worker \
     --timeout 900 \
     --memory-size 2048
   ```

4. For stuck jobs:
   ```bash
   # Reset job status
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
   # Invalidate cache
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

### Worker Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "GitHub API rate limit exceeded" | Too many GitHub API requests | Implement rate limiting and backoff strategy |
| "Repository not found" | Invalid repository name or access issue | Verify repository exists and check permissions |
| "Claude API error: context length exceeded" | Code too large for Claude context window | Implement chunking strategy for large files |
| "Lambda execution timed out" | Worker Lambda exceeding 15min timeout | Break job into smaller chunks |
| "Out of memory" | Lambda using too much memory | Increase Lambda memory allocation |

### Frontend Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "API endpoint not found" | Incorrect API URL configuration | Update API URL in frontend config |
| "Failed to fetch" | CORS issues or API unavailable | Check CORS configuration and API status |
| "Unauthorized" | GitHub OAuth token issues | Verify OAuth flow and token handling |
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
# Update GitHub OAuth secret
aws secretsmanager update-secret \
  --secret-id cody-batch-github-oauth \
  --secret-string '{"clientId":"new-id","clientSecret":"new-secret"}'

# Update Claude API key
aws secretsmanager update-secret \
  --secret-id cody-batch-claude-api \
  --secret-string '{"apiKey":"new-key"}'