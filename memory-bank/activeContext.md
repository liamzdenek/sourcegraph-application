# Active Context: Cody Batch

## Current Work Focus

We are in the initial planning and setup phase of the Cody Batch project. The primary focus is on:

1. **Project Structure Definition**: Establishing the Nx monorepo structure and package organization
2. **Core Architecture Design**: Defining the system components and their interactions
3. **Infrastructure Setup**: Creating the AWS CDK configuration for deployment
4. **Initial Frontend Scaffold**: Setting up the React application with Tanstack Router
5. **Initial Backend Scaffold**: Setting up the Express API for Lambda deployment

## Recent Changes

Based on feedback, we've made several important architectural adjustments:

1. **AWS Batch Instead of Lambda for Job Processing**: The job processor will use AWS Batch instead of Lambda to handle jobs that may take longer than 15 minutes.

2. **Service Account Authentication**: Removed frontend OAuth flow in favor of a service account approach with credentials passed as environment variables.

3. **Generic Prompting System**: Made the tool generic for any prompt, not just vulnerability detection, using "wereChangesNecessary" instead of "vulnerabilityDetected".

4. **Repository Limit**: Added a limit of 5 repositories per request for cost containment.

5. **Simplified Secrets Management**: Using environment variables instead of AWS Secrets Manager for secrets.

6. **CloudFront Invalidation**: Using BucketDeployment in CDK for automatic invalidation.

7. **Enhanced Result Persistence**: Added support for downloading patch files and viewing Claude message threads.

## Next Steps

### Immediate Tasks (Next 1-2 Days)

1. **Initialize Nx Workspace**:
   - Set up the monorepo structure with appropriate packages
   - Configure build and lint settings
   - Set up TypeScript configuration

2. **Create Shared Package**:
   - Define common types and interfaces
   - Set up utility functions
   - Create Zod schemas for validation

3. **Set Up CDK Infrastructure**:
   - Define DynamoDB tables
   - Configure AWS Batch compute environment and job queue
   - Set up API Gateway
   - Create S3 bucket for frontend hosting with BucketDeployment
   - Configure CloudFront distribution

4. **Initialize API Package**:
   - Set up Express application
   - Configure Lambda handler
   - Create basic health check endpoint
   - Set up job management endpoints

5. **Initialize Batch Job Package**:
   - Create job processing framework
   - Set up GitHub API integration
   - Set up Claude API integration
   - Implement basic job handling logic

6. **Initialize Frontend Package**:
   - Set up React application
   - Configure Tanstack Router
   - Create basic layout and navigation
   - Implement job creation and monitoring interfaces

### Short-Term Goals (Next Week)

1. **Implement Core Job Processing**:
   - Repository scanning
   - Basic code analysis
   - Integration with Claude 3.7
   - Pull request creation for owned repositories
   - Patch file generation and storage

2. **Develop Frontend Features**:
   - Job creation form with repository limit
   - Job status monitoring
   - Result visualization
   - Patch file download
   - Claude message thread viewing

3. **Enhance API Capabilities**:
   - Job management endpoints
   - Result retrieval
   - Error handling
   - Pagination and filtering

4. **Deploy Initial Version**:
   - Set up AWS resources
   - Deploy backend services
   - Deploy frontend application
   - Verify end-to-end functionality

### Medium-Term Goals (Next 2-3 Weeks)

1. **Implement Advanced Features**:
   - Support for multiple prompt types
   - Batch job processing
   - Enhanced result visualization
   - Job scheduling

2. **Optimize Performance**:
   - Improve Claude prompt engineering
   - Optimize GitHub API usage
   - Enhance DynamoDB access patterns
   - Reduce cold start impact

3. **Enhance User Experience**:
   - Improve error messaging
   - Add progress indicators
   - Implement result filtering and search
   - Add user preferences

## Active Decisions and Considerations

### Architecture Decisions

1. **Serverless vs. Container-Based**:
   - **Decision**: Using AWS Batch for job processing and Lambda for API
   - **Rationale**: AWS Batch can handle longer-running jobs, while Lambda is suitable for API requests
   - **Considerations**: Need to manage container images and compute environments

2. **Monolithic vs. Microservices**:
   - **Decision**: Using a microservices approach with separate API and Batch services
   - **Rationale**: Better separation of concerns, independent scaling, and deployment
   - **Considerations**: Need to manage inter-service communication and consistency

3. **Data Storage Strategy**:
   - **Decision**: Using DynamoDB as the primary datastore
   - **Rationale**: Serverless, scalable, and consistent performance
   - **Considerations**: Need to design efficient access patterns and manage costs

4. **Authentication Strategy**:
   - **Decision**: Using a service account with credentials passed as environment variables
   - **Rationale**: Simplifies authentication flow and aligns with real-world usage
   - **Considerations**: Need to manage credential security and rotation

### Technical Considerations

1. **GitHub API Integration**:
   - How to handle rate limiting for large repositories
   - Strategies for efficient repository scanning
   - Managing service account credentials securely

2. **Claude 3.7 Integration**:
   - Prompt engineering for effective code analysis
   - Handling large codebases within token limits
   - Storing and displaying message threads

3. **Job Processing**:
   - Handling long-running jobs with AWS Batch
   - Implementing retry and error recovery mechanisms
   - Managing parallel processing for efficiency

4. **Security Considerations**:
   - Securing GitHub service account credentials
   - Limiting repository access to specified patterns
   - Protecting against injection attacks in generated code

### Open Questions

1. **Scope Limitations**:
   - What specific prompt types should be supported initially?
   - How complex should the fix generation logic be?
   - What level of user customization should be supported?

2. **Performance Targets**:
   - What is an acceptable processing time for a typical repository?
   - How many concurrent jobs should the system support?
   - What are the cost implications of different processing strategies?

3. **User Experience**:
   - How to provide meaningful feedback during long-running jobs
   - How to present complex code changes in an understandable way
   - How to handle partial successes or failures