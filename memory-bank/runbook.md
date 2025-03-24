# Runbook: Cody Batch

This runbook provides procedures for common operational tasks and troubleshooting scenarios for the Cody Batch system. It follows the Validate, Triage, Act, Reflect (VTAR) methodology for incident response.

## Deployment Procedures
### Initial Deployment

#### Prerequisites
- AWS CLI configured with appropriate credentials (profile "lz-demos")
- Node.js 18+ installed
- Nx CLI installed globally (`npm install -g nx`)
- Docker installed and configured
- GitHub service account token
- Claude API key obtained (optional)

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
   AWS_REGION=us-west-2
   ALLOWED_REPOSITORIES=liamzdenek/*
   EOF
   ```

4. Deploy everything with a single command
   ```bash
   nx run cdk:deploy
   ```

   This comprehensive deployment command:
   - Cleans up previous build artifacts
   - Builds all packages
   - Deploys the CDK stack to AWS
   - Builds and pushes the Docker image for the batch job
   - Outputs all important URLs and resource names

6. Verify deployment
   ```bash
   # Check if API is accessible
   curl https://a1p6i4snfc.execute-api.us-west-2.amazonaws.com/prod/health
   
   # Check if frontend is accessible
   curl -I https://drph83xl8iiin.cloudfront.net
   ```

### Troubleshooting Deployment Issues

#### Common Issues and Solutions

1. **Permission Issues with CDK Build**
   
   **Symptoms**: Error messages like "EACCES: permission denied, rmdir 'dist/packages/cdk/cdk.out/asset...'"
   
   **Solution**:
   ```bash
   # Clean up the CDK output directory
   rm -rf dist/packages/cdk/cdk.out
   
   # Try the deployment again
   nx run cdk:deploy
   ```

2. **Manifest.json Not Found Error**
   
   **Symptoms**: Error message "ENOENT: no such file or directory, open 'manifest.json'"
   
   **Solution**:
   ```bash
   # Update the deploy command in packages/cdk/project.json to use:
   # "command": "cdk deploy --app ./main.js --profile lz-demos --require-approval never"
   
   # Then run the deployment again
   nx run cdk:deploy
   ```

3. **Missing Environment Variables**
   
   **Symptoms**: Warning messages like "Warning: Missing environment variables: CLAUDE_API_KEY"
   
   **Solution**:
   - For optional variables like CLAUDE_API_KEY, this warning can be ignored
   - For required variables, add them to your environment or .env file
   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

4. **API Gateway Errors**
   
   **Symptoms**: 5XX errors from API Gateway
   
   **Solution**:
   ```bash
   # Check API Lambda logs
   aws logs get-log-events --log-group-name /aws/lambda/CodyBatchStack-ApiLambda --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/CodyBatchStack-ApiLambda --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text) --profile lz-demos
   
   # Redeploy API if needed
   nx run api:build
   nx run cdk:deploy
   ```

5. **CloudFront Distribution Not Accessible**
   
   **Symptoms**: Unable to access the frontend
   
   **Solution**:
   ```bash
   # Check CloudFront distribution status
   aws cloudfront get-distribution --id $(aws cloudformation describe-stacks --stack-name CodyBatchStack --profile lz-demos --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text) --profile lz-demos
   
   # Create invalidation if needed
   aws cloudfront create-invalidation --distribution-id $(aws cloudformation describe-stacks --stack-name CodyBatchStack --profile lz-demos --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text) --paths "/*" --profile lz-demos
   ```
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

2. Deploy everything with a single command (recommended approach)
   ```bash
   # This comprehensive command will:
   # 1. Clean up previous build artifacts
   # 2. Build all packages
   # 3. Deploy the CDK stack
   # 4. Build the Docker image
   # 5. Tag the image with the ECR repository URI
   # 6. Log in to ECR
   # 7. Push the image to ECR
   nx run cdk:deploy
   ```

3. If you only need to update the batch job without redeploying the entire stack:
   ```bash
   # Build batch job
   nx run batch:build
   
   # Deploy batch job only
   nx run cdk:deploy-batch
   ```

4. If you need to run the Docker operations separately:
   ```bash
   # Build the Docker image
   nx run batch:docker-build
   
   # Tag the image with the ECR repository URI
   nx run batch:docker-tag
   
   # Log in to ECR
   nx run batch:docker-login
   
   # Push the image to ECR
   nx run batch:docker-push
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

#### Troubleshooting Docker Image Issues

1. **ECR Repository Not Found**
   
   **Symptoms**: Error message like "The repository with name 'cody-batch-job' does not exist in the registry"
   
   **Solution**:
   ```bash
   # Deploy the CDK stack first to create the ECR repository
   nx run cdk:deploy
   
   # Then build and push the Docker image
   nx run cdk:deploy-batch
   ```

2. **Docker Build Fails**
   
   **Symptoms**: Error during Docker build
   
   **Solution**:
   ```bash
   # Check if Docker is running
   docker info
   
   # Make sure all required packages are built
   nx run-many --target=build --projects=batch,shared,github-client,claude-client
   
   # Try building with verbose output
   docker build -t cody-batch-job -f packages/batch/Dockerfile . --progress=plain
   ```

3. **Docker Build is Slow**
   
   **Symptoms**: Docker build takes a long time to complete
   
   **Solution**:
   ```bash
   # Optimize Dockerfile layer ordering
   # 1. Install system dependencies first (rarely change)
   # 2. Copy and install package dependencies (change less frequently)
   # 3. Copy application code (changes most frequently)
   
   # Example of optimized Dockerfile:
   FROM node:18-slim
   WORKDIR /app
   
   # Install git first (system dependency that rarely changes)
   RUN apt-get update && apt-get install -y git
   
   # Copy package files (change less frequently than source code)
   COPY packages/batch/package.json ./
   COPY package-lock.json ./
   
   # Install dependencies
   RUN npm install --production
   
   # Copy the built application (changes most frequently)
   COPY dist/packages/batch ./dist/packages/batch
   COPY dist/packages/shared ./dist/packages/shared
   COPY dist/packages/github-client ./dist/packages/github-client
   COPY dist/packages/claude-client ./dist/packages/claude-client
   
   # Set the entry point
   ENTRYPOINT ["node", "dist/packages/batch/main.js"]
   ```

3. **AWS CLI Authentication Issues**
   
   **Symptoms**: "Unable to locate credentials" or "Access denied" errors
   
   **Solution**:
   ```bash
   # Verify AWS CLI configuration
   aws configure list --profile lz-demos
   
   # Try manually logging in to ECR
   aws ecr get-login-password --profile lz-demos | docker login --username AWS --password-stdin $(aws ecr describe-repositories --repository-names cody-batch-job --profile lz-demos --query 'repositories[0].repositoryUri' --output text | cut -d'/' -f1)
   ```

4. **Job Runs But Shows AWS CLI Help**
   
   **Symptoms**: Job runs but only shows AWS CLI help text
   
   **Solution**: This indicates the Docker image wasn't properly built or pushed. Follow these steps:
   ```bash
   # Rebuild and push the Docker image
   nx run cdk:deploy
   
   # Verify the image exists in ECR
   aws ecr describe-images --repository-name cody-batch-job --profile lz-demos
   ```

5. **Missing Dependencies in Batch Job**
   
   **Symptoms**: Error messages like "Cannot find module 'zod-to-json-schema'" or "Cannot find module '@octokit/rest'" or "Cannot find module 'simple-git'" or "Cannot find module 'glob'"
   
   **Solution**: Add the missing dependencies to the batch package.json and rebuild:
   ```bash
   # Add the dependencies
   cd packages/batch
   npm install --save zod-to-json-schema @octokit/rest simple-git glob
   
   # Rebuild and redeploy
   nx run cdk:deploy
   ```
   
   **Required Dependencies**:
   The batch job requires these key dependencies:
   - `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-batch`: AWS SDK for DynamoDB and Batch
   - `@octokit/rest`: GitHub API client
   - `simple-git`: Git operations library
   - `glob`: File pattern matching
   - `zod`: Schema validation
   - `zod-to-json-schema`: Convert Zod schemas to JSON Schema
   - `dotenv`: Environment variable management
   
   **Testing Dependencies Locally**:
   ```bash
   # Build and test the Docker container locally
   docker build -t cody-batch-job -f packages/batch/Dockerfile .
   docker run --rm cody-batch-job
   
   # Expected output: "Job ID is required" (when no job ID is provided)
   # If you see "Cannot find module" errors, add the missing dependency
   ```

6. **Frontend API URL Not Set Correctly**
   
   **Symptoms**: Frontend shows "loading job details" forever, API requests fail
   
   **Solution**: Make sure the frontend is built with the correct API URL:
   ```bash
   # Build frontend with API URL from CloudFormation
   nx run cdk:build-frontend
   
   # Deploy everything with the correct build sequence
   nx run cdk:deploy
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

### Claude Client Issues

#### Validate
1. Check if the Claude API is accessible
   ```bash
   # Test the Claude API with a simple request
   curl -v https://api.anthropic.com/v1/messages \
     -H "Content-Type: application/json" \
     -H "x-api-key: $CLAUDE_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -d '{
       "model": "claude-3-7-sonnet-20250219",
       "max_tokens": 1000,
       "messages": [{"role": "user", "content": "Hello, Claude!"}]
     }'
   ```

2. Check Claude API rate limits
   ```bash
   # Make a request and check the rate limit headers in the response
   curl -v https://api.anthropic.com/v1/messages \
     -H "Content-Type: application/json" \
     -H "x-api-key: $CLAUDE_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -d '{
       "model": "claude-3-7-sonnet-20250219",
       "max_tokens": 10,
       "messages": [{"role": "user", "content": "Hi"}]
     }' 2>&1 | grep -i "anthropic-ratelimit"
   ```

3. Verify Claude client logs
   ```bash
   # Check logs for Claude client errors
   grep -r "Error calling Claude API" /path/to/logs
   ```

#### Triage
1. Determine the type of failure:
   - Authentication issues: Check API key
   - Rate limit issues: Check rate limit headers
   - Model availability: Check if the model is available
   - Request format issues: Check request payload
   - Response parsing issues: Check response format

2. Check Claude API documentation for changes
   ```bash
   # Open the Claude API documentation
   open https://docs.anthropic.com/claude/reference/
   ```

3. Check for Claude API status updates
   ```bash
   # Check Anthropic status page
   open https://status.anthropic.com/
   ```

#### Act
1. For authentication issues:
   ```bash
   # Update Claude API key
   export CLAUDE_API_KEY="new-api-key"
   
   # Update environment variables in configuration
   sed -i 's/CLAUDE_API_KEY=.*/CLAUDE_API_KEY=new-api-key/' .env
   ```

2. For rate limit issues:
   ```bash
   # Implement exponential backoff and retry logic
   # Example retry logic in code:
   # let retries = 0;
   # while (retries < maxRetries) {
   #   try {
   #     const response = await fetch('https://api.anthropic.com/v1/messages', ...);
   #     if (response.ok) return response;
   #   } catch (error) {
   #     if (error.status === 429) {
   #       const backoff = Math.pow(2, retries) * 1000;
   #       await new Promise(resolve => setTimeout(resolve, backoff));
   #       retries++;
   #     } else {
   #       throw error;
   #     }
   #   }
   # }
   ```

3. For model availability issues:
   ```bash
   # Update to use a different model
   # In code:
   # const model = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';
   ```

4. For request format issues:
   ```bash
   # Update request format to match API requirements
   # Example:
   curl -v https://api.anthropic.com/v1/messages \
     -H "Content-Type: application/json" \
     -H "x-api-key: $CLAUDE_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -d '{
       "model": "claude-3-7-sonnet-20250219",
       "max_tokens": 1000,
       "messages": [{"role": "user", "content": "Hello, Claude!"}]
     }'
   ```

5. For response parsing issues:
   ```bash
   # Update response parsing logic
   # Example:
   # try {
   #   const responseText = await response.text();
   #   console.log('Response text:', responseText);
   #   const responseData = JSON.parse(responseText);
   # } catch (error) {
   #   console.error('Error parsing response:', error);
   # }
   ```

#### Reflect
1. Document the incident
2. Update Claude client code if needed
3. Consider adding more robust error handling and logging

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

### Claude Client Errors

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "Error calling Claude API: 401 Unauthorized" | Invalid API key | Check and update Claude API key |
| "Error calling Claude API: 429 Too Many Requests" | Rate limit exceeded | Implement backoff and retry strategy |
| "Error calling Claude API: 400 Bad Request" | Invalid request format | Check request payload format |
| "Error parsing response" | Invalid response format | Check response parsing logic |
| "Cannot read properties of undefined (reading 'messages')" | SDK version mismatch | Update SDK or use direct API calls |
| "max_tokens: X > Y, which is the maximum allowed" | Token limit exceeded | Reduce max_tokens parameter |
| "model: X is not supported on this API" | Using wrong API for model | Use Messages API for Claude 3 models |
| "Unexpected token '<', '<html>..." | HTML response instead of JSON | Check API endpoint and authentication |

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

### Claude Client Maintenance

#### Testing Claude API Connection
```bash
# Test Claude API connection
curl -v https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Hello, Claude!"}]
  }'
```

#### Updating Claude SDK
```bash
# Update Claude SDK
npm update @anthropic-ai/sdk

# Check SDK version
npm list @anthropic-ai/sdk
```

#### Monitoring Claude API Usage
```bash
# Check Claude API usage from logs
grep -r "Token usage" /path/to/logs | tail -n 10

# Extract token usage statistics
grep -r "Token usage" /path/to/logs | awk '{print $NF}' | jq -s 'add'
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
```

### Testing Claude Client Locally
```bash
# Set environment variables
export CLAUDE_API_KEY="your-api-key"
export CLAUDE_MODEL="claude-3-7-sonnet-20250219"
export CLAUDE_MAX_TOKENS="64000"

# Run test script
nx run claude-client:test --path=test-project --prompt="Analyze this repository and identify any security vulnerabilities." --iterations=5

# View conversation history
cat claude-session.json | jq
