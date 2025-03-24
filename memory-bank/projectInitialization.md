# Project Initialization Guide

This document outlines the steps to initialize the Cody Batch project. It provides a detailed approach to setting up the project structure, configuring the development environment, and preparing for implementation.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v8 or later)
- AWS CLI (configured with appropriate credentials)
- Docker (for building and testing AWS Batch containers)
- Git

## Step 1: Initialize the Nx Workspace

```bash
# Create the .gitignore file first
# (See memory-bank/gitignore.md for full content)

# Initialize the Nx workspace
npx create-nx-workspace@latest cody-batch --preset=ts --nx-cloud=false
cd cody-batch

# Update nx.json to configure output paths
cat > nx.json << EOF
{
  "installation": {
    "version": "20.6.2"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
EOF
```

## Step 2: Create Package Structure

```bash
# Create shared package
nx generate @nx/js:library shared --directory=packages/shared --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create github-client package
nx generate @nx/js:library github-client --directory=packages/github-client --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create claude-client package
nx generate @nx/js:library claude-client --directory=packages/claude-client --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create API package
nx generate @nx/node:application api --directory=packages/api --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create batch package
nx generate @nx/node:application batch --directory=packages/batch --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create frontend package
nx generate @nx/react:application frontend --directory=packages/frontend --bundler=webpack --unitTestRunner=jest --style=css --routing=false --no-interactive

# Create CDK package
nx generate @nx/node:application cdk --directory=packages/cdk --bundler=esbuild --unitTestRunner=jest --no-interactive
```

## Step 3: Configure TypeScript

```bash
# Update root tsconfig.json with proper path mappings for shared packages
```

## Step 4: Install Core Dependencies

```bash
# Install shared dependencies
npm install --save zod @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb

# Install API dependencies
npm install --save express @types/express cors @types/cors helmet cookie-parser @types/cookie-parser dotenv @aws-sdk/client-batch

# Install batch dependencies
npm install --save @octokit/rest simple-git @anthropic-ai/sdk

# Install frontend dependencies
npm install --save @tanstack/react-router @tanstack/react-query axios

# Install CDK dependencies
npm install --save aws-cdk-lib constructs
npm install --save-dev aws-cdk
```

## Step 5: Configure Shared Package

Create the basic types and utilities in the shared package:

- Job types with repository limit of 5
- Repository types with Claude message thread support
- Logger utility
- Validation utility using Zod

## Step 6: Configure CDK Infrastructure

Create the CDK stack with:

- DynamoDB tables for jobs and repositories
- AWS Batch compute environment, job queue, and job definition
- API Gateway and Lambda for the API
- S3 bucket with CloudFront for frontend hosting
- BucketDeployment for automatic invalidation
- ECR repository for batch job container
- Proper IAM roles and permissions

## Step 7: Configure API Package

Create the API Lambda handler with:

- Express application with proper middleware
- Health check endpoint that verifies all dependencies
- Job management endpoints
- Repository result endpoints
- AWS Batch job submission

## Step 8: Configure Batch Package

Create the batch job with:

- Dockerfile for containerization
- Job processing logic
- GitHub API integration using service account
- Claude API integration
- Repository analysis and code modification
- Pull request creation and diff generation
- Claude message thread storage

## Step 9: Configure Frontend Package

Create the frontend application with:

- React with Tanstack Router
- Job creation form with repository limit
- Job status monitoring
- Result visualization
- Patch file download
- Claude message thread viewing

## Step 10: Set Up Environment Variables

```bash
# Create .env file with required variables
cat > .env << EOF
GITHUB_TOKEN=your_github_token
CLAUDE_API_KEY=your_claude_api_key
AWS_REGION=us-east-1
ALLOWED_REPOSITORIES=liamzdenek/*
EOF
```

## Step 11: Build and Deploy

```bash
# Build all packages
nx run-many --target=build --all

# Build Docker image for batch job
nx run batch:docker-build

# Push Docker image to ECR
nx run batch:docker-push

# Deploy infrastructure
nx run cdk:deploy
```

## Next Steps

After initializing the project, the next steps would be:

1. Implement the GitHub client package
2. Implement the Claude client package
3. Complete the API routes
4. Implement the batch job processing logic
5. Develop the frontend UI components
6. Test the end-to-end flow
7. Deploy to AWS

Each of these steps would involve detailed implementation work that builds upon the foundation established during initialization.
