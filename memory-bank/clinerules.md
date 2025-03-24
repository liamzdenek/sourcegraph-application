# Cody Batch Project Intelligence

This document captures important patterns, preferences, and project intelligence that help work more effectively with the Cody Batch project.

## Critical Implementation Paths

1. **GitHub Service Account Authentication**
   - Service account token is required for GitHub API access
   - Token must be stored securely as an environment variable
   - All GitHub API calls must include proper authentication
   - Pull requests should only be created for repositories matching `github.com/liamzdenek/*`

2. **Claude API Integration**
   - Prompt engineering is critical for accurate code analysis
   - Responses must be carefully parsed and validated
   - Token usage must be monitored and optimized
   - Message threads must be stored for transparency

3. **Job Processing Pipeline**
   - Jobs must be processed using AWS Batch for long-running tasks
   - Repository processing should be parallelized when possible
   - Status updates must be frequent and accurate
   - Limited to 5 repositories per job for cost containment

4. **Pull Request and Diff Management**
   - PRs should only be created for repositories matching `github.com/liamzdenek/*`
   - PR title and description should clearly explain the changes
   - Generated code must be validated before submission
   - Successful PR links should be stored and reused
   - Patch files must be available for download

## User Preferences and Workflow

1. **Code Style**
   - Use TypeScript for all code
   - Follow 12-Factor app principles
   - Use CSS modules (no Tailwind or other CSS frameworks)
   - Use Tanstack Router (not React Router)

2. **Development Workflow**
   - Use `nx generate` commands for project initialization
   - Always use `--save` or `--save-dev` for dependencies
   - No mocking or local development - use actual AWS deployments for testing
   - No one-off scripts - attach to `nx run` commands

3. **Deployment Preferences**
   - Deploy using AWS CDK
   - Use NodejsFunction primitive in CDK for Lambda
   - Use AWS Batch for job processing
   - Use BucketDeployment for frontend with automatic invalidation
   - Use Origin Access Identity to connect CloudFront to the frontend's S3 bucket

4. **Testing Approach**
   - No e2e testing with Playwright (out of scope)
   - Use curl and AWS CLI for testing deployments

## Project-Specific Patterns

1. **Monorepo Structure**
   - All packages must be in the `packages` directory
   - Single output `dist` directory at the root with subfolders for each package
   - Shared types must be in a shared package

2. **Error Handling**
   - No fallbacks - main path works or fails with logging
   - Always include debug logging for requests and responses
   - Always include health check endpoints with dependency checks

3. **Configuration Management**
   - Use environment variables for configuration and secrets
   - Pass location/ARN of AWS resources through environment variables
   - For frontend code, make environment variables available at build time
   - Do not use AWS Secrets Manager

4. **Build Process**
   - After updating build configuration, clean old build artifacts
   - Rerun the build and validate that artifacts were saved
   - Do not mark the AWS SDK as external, it should be bundled
   - Build Docker images for AWS Batch jobs

## Known Challenges

1. **AWS Batch Job Duration**
   - Long-running repository analyses require careful resource management
   - Solution: Implement job chunking and progress tracking

2. **GitHub API Rate Limits**
   - Large repositories may hit API rate limits
   - Solution: Implement rate limiting and backoff strategies

3. **Claude Context Window**
   - Large files may exceed Claude's context window
   - Solution: Implement file chunking and context management

4. **DynamoDB Query Limitations**
   - Complex queries may be challenging
   - Solution: Design efficient access patterns and use GSIs

5. **Patch File Size**
   - Large diffs might exceed DynamoDB item size limits
   - Solution: Store large diffs in S3 and references in DynamoDB

## Evolution of Project Decisions

1. **Initial Architecture**
   - Serverless architecture with AWS Lambda and AWS Batch
   - DynamoDB for data storage
   - GitHub service account for authentication

2. **Security Considerations**
   - Limit PR creation to specific repositories
   - Secure storage of service account token
   - Validate all user inputs
   - Use environment variables for secrets

3. **Performance Optimizations**
   - Parallel processing of repositories
   - Efficient Claude prompt engineering
   - Optimized DynamoDB access patterns
   - Repository limit for cost containment

## Tool Usage Patterns

1. **AWS CDK**
   - Use for all infrastructure definition
   - Deploy infrastructure before application updates
   - Use CloudFormation for resource provisioning
   - Use BucketDeployment for frontend

2. **Nx Commands**
   - Use `nx generate` for project initialization
   - Use `nx run` for build and deployment
   - Use `nx run-many` for multi-package operations
   - Use custom commands for Docker operations

3. **AWS CLI**
   - Use for testing deployments
   - Use for monitoring logs
   - Use for manual operations
   - Use for AWS Batch job management

4. **GitHub API**
   - Use for repository operations
   - Use for pull request creation
   - Use service account authentication
   - Store and reuse pull request links

## Important Rules

1. Always implement the FULL code or make the entire file a placeholder
2. Never generate placeholders in the middle of a program
3. Always "sleep 10 && [command]" when checking CloudWatch logs
4. Always include a health check endpoint
5. Use Zod for schema validation
6. Put all shared types in a shared package
7. Always write the .gitignore before installing dependencies
8. Do not use --routing in nx generate (use Tanstack Router instead)
9. Save operational learnings to runbook.md
10. Limit jobs to 5 repositories maximum
11. Use environment variables for secrets, not AWS Secrets Manager
12. Store Claude message threads for transparency
13. Make patch files available for download
14. Store and reuse pull request links