# Project Brief: Cody Batch - Autonomous Repository Remediation

## Overview
Cody Batch is an AI-powered tool that leverages Claude 3.7 to perform bulk changes on GitHub repositories. It's designed to automatically analyze code and apply changes based on specific prompts, such as updating dependencies, fixing security vulnerabilities, or refactoring code patterns. The system can automatically create pull requests for owned repositories or generate diffs for non-owned repositories.

## Core Requirements

### Functional Requirements
- Scan GitHub repositories for patterns based on user-provided prompts
- Use Claude 3.7 to analyze code and generate changes
- Automatically create pull requests for repositories owned by the user (limited to github.com/liamzdenek/*)
- Generate and store diffs for download
- Store and display Claude message threads
- Provide a dashboard to manage jobs and view results
- Support downloading patch files
- Limit to 5 repositories per job for cost containment

### Technical Requirements
- Implement as a 12-Factor app with cloud-native principles
- Use Nx monorepo structure with packages in the 'packages' directory
- Frontend: React with TypeScript and CSS modules (no Tailwind or CSS frameworks)
- Backend API: NodeJS with Express, deployed to AWS Lambda
- Job Processing: AWS Batch for long-running jobs
- Database: DynamoDB for job and result storage
- Infrastructure: AWS CDK for deployment
- Routing: Tanstack Router (not React Router)
- Schema Validation: Zod
- Single output 'dist' directory at the root with subfolders for each package
- Use environment variables for secrets (not AWS Secrets Manager)
- Use S3 BucketDeployment for frontend with automatic invalidation

### Non-Functional Requirements
- Production-ready, highly scalable architecture
- Comprehensive error handling and logging
- Security-focused design, especially for GitHub API integration
- Performance optimized for batch processing
- Cost-efficient processing with repository limits

## Out of Scope
- CI/CD pipeline setup
- E2E testing with Playwright or similar tools
- Local development environment with mocks
- Support for repositories outside github.com/liamzdenek/*
- Support for non-GitHub repositories
- Frontend user authentication (using service account instead)

## Success Criteria
- Successfully scan repositories and identify necessary changes
- Generate correct changes using Claude 3.7
- Create valid pull requests for owned repositories
- Provide downloadable patch files
- Display Claude message threads
- Deploy a working system to AWS
- Demonstrate scalability for processing multiple repositories
- Process jobs that take longer than 15 minutes