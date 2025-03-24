# Active Context: Cody Batch

## Current Work Focus

We are in the initial planning and setup phase of the Cody Batch project. The primary focus is on:

1. **Project Structure Definition**: Establishing the Nx monorepo structure and package organization
2. **Core Architecture Design**: Defining the system components and their interactions
3. **Infrastructure Setup**: Creating the AWS CDK configuration for deployment
4. **Initial Backend Scaffold**: Setting up the Express API for Lambda deployment
5. **Initial Frontend Scaffold**: Setting up the React application with Vite and Tanstack Router

## Recent Changes

Based on feedback, we've made several important architectural adjustments:

1. **AWS Batch Instead of Lambda for Job Processing**: The job processor will use AWS Batch instead of Lambda to handle jobs that may take longer than 15 minutes.

2. **Service Account Authentication**: Removed frontend OAuth flow in favor of a service account approach with credentials passed as environment variables.

3. **Generic Prompting System**: Made the tool generic for any prompt, not just vulnerability detection, using "wereChangesNecessary" instead of "vulnerabilityDetected".

4. **Repository Limit**: Added a limit of 5 repositories per request for cost containment.

5. **Simplified Secrets Management**: Using environment variables instead of AWS Secrets Manager for secrets.

6. **CloudFront Invalidation**: Using BucketDeployment in CDK for automatic invalidation.

7. **Enhanced Result Persistence**: Added support for downloading patch files and viewing Claude message threads.

8. **API Package Implementation**: Set up the Express API with ESM modules, implemented health check, repository listing, and job management endpoints.

9. **Frontend with Vite**: Set up the frontend package with Vite instead of Webpack for better performance and developer experience.

## Next Steps

### Immediate Tasks (Next 1-2 Days)

1. **Initialize Nx Workspace**: ✅
   - Set up the monorepo structure with appropriate packages ✅
   - Configure build and lint settings ✅
   - Set up TypeScript configuration ✅

2. **Create Shared Package**: ✅
   - Define common types and interfaces
   - Set up utility functions
   - Create Zod schemas for validation

3. **Initialize GitHub Client Package**: ✅
   - Set up GitHub API client
   - Implement repository operations
   - Create service account authentication

4. **Initialize Claude Client Package**: ✅
   - Set up Claude API client
   - Develop prompt engineering
   - Implement response parsing

5. **Initialize API Package**: ✅
   - Set up Express application ✅
   - Configure Lambda handler ✅
   - Create health check endpoint ✅
   - Set up job management endpoints ✅
   - Set up error handling and logging ✅

6. **Initialize Batch Package**: ✅
   - Set up package structure ✅
   - Create job processing framework
   - Set up GitHub API integration
   - Set up Claude API integration

7. **Initialize Frontend Package**: ✅
   - Set up React application with Vite ✅
   - Configure Tanstack Router
   - Create basic layout and navigation

8. **Initialize CDK Package**: ✅
   - Set up package structure ✅
   - Define AWS resources
   - Configure deployment

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
   - Connect API to DynamoDB for persistent storage
   - Implement AWS Batch job submission
   - Add authentication and authorization
   - Implement pagination and filtering

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

5. **Module System**:
   - **Decision**: Using ESM modules for all packages
   - **Rationale**: Modern JavaScript standard with better tree-shaking and import/export syntax
   - **Considerations**: Need to include file extensions in import statements

6. **Frontend Build Tool**:
   - **Decision**: Using Vite instead of Webpack
   - **Rationale**: Faster development experience, better performance, and simpler configuration
   - **Considerations**: Need to ensure compatibility with other tools in the ecosystem

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