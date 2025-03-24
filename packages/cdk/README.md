# Cody Batch CDK

This package contains the AWS CDK infrastructure for the Cody Batch project.

## Overview

The CDK stack deploys the following resources:

- DynamoDB tables for jobs and repositories
- AWS Batch compute environment and job queue
- Lambda function for the API
- API Gateway for the REST API
- S3 bucket and CloudFront distribution for the frontend
- IAM roles and policies

## Prerequisites

- AWS CLI configured with the `lz-demos` profile
- Node.js 18 or later
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

## Environment Variables

The following environment variables are required:

- `GITHUB_TOKEN`: GitHub service account token
- `CLAUDE_API_KEY`: Claude API key
- `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repository patterns (default: `github.com/liamzdenek/*`)
- `CDK_DEFAULT_ACCOUNT`: AWS account ID
- `CDK_DEFAULT_REGION`: AWS region (default: `us-west-2`)

## Deployment

To deploy the infrastructure, run:

```bash
# Set environment variables
export GITHUB_TOKEN=your-github-token
export CLAUDE_API_KEY=your-claude-api-key

# Deploy using nx
nx deploy
```

This will:

1. Build all packages (api, batch, frontend, cdk)
2. Deploy the CDK stack using the `lz-demos` AWS profile
3. Output the URLs for the API and frontend

## Outputs

After deployment, the following outputs are available:

- `ApiUrl`: The URL of the API Gateway
- `FrontendUrl`: The URL of the CloudFront distribution
- `JobsTableName`: The name of the DynamoDB jobs table
- `RepositoriesTableName`: The name of the DynamoDB repositories table
- `JobQueueArn`: The ARN of the AWS Batch job queue
- `JobDefinitionArn`: The ARN of the AWS Batch job definition

## Development

To make changes to the infrastructure:

1. Modify the `cody-batch-stack.ts` file
2. Run `nx build cdk` to build the CDK package
3. Run `nx deploy` to deploy the changes

## Cleanup

To destroy the infrastructure, run:

```bash
cd dist/packages/cdk
cdk destroy --profile lz-demos
```

This will remove all resources created by the CDK stack.