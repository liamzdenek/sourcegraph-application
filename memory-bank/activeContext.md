# Active Context: Cody Batch

## Current Work Focus

We are in the initial implementation phase of the Cody Batch project. The primary focus is on:

1. **Core Component Implementation**: Implementing the key components of the system
2. **Claude Client Development**: Building the Claude client for AI code analysis
3. **Integration Planning**: Preparing for integration of all components
4. **Testing Strategy**: Developing a testing approach for the system
5. **Batch Processing Framework**: Designing the batch processing framework
6. **Frontend Development**: Starting work on the frontend components
7. **Infrastructure Setup**: Preparing the AWS infrastructure for deployment

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

10. **GitHub Client Implementation**: Implemented a comprehensive GitHub client with repository operations, cloning, branch creation, and pull request management.

11. **Shared Package Implementation**: Implemented shared package with common types, Zod schemas, utility functions, and configuration.

12. **ESLint Dependency Checks**: Replaced deprecated generatePackageJson option with ESLint dependency checks for library packages.

13. **Claude Client Implementation**: Implemented a comprehensive Claude client with tool-based interaction, autonomous sessions, token usage tracking, and prompt caching.

## Next Steps

### Immediate Tasks (Next 1-2 Days)

1. **Initialize Nx Workspace**: ✅
   - Set up the monorepo structure with appropriate packages ✅
   - Configure build and lint settings ✅
   - Set up TypeScript configuration ✅

2. **Create Shared Package**: ✅
   - Define common types and interfaces ✅
   - Set up utility functions ✅
   - Create Zod schemas for validation ✅
   - Set up constants and configuration ✅

3. **Initialize GitHub Client Package**: ✅
   - Set up GitHub API client ✅
   - Implement repository operations ✅
   - Create service account authentication ✅
   - Implement pull request creation ✅
   - Develop rate limit management ✅

4. **Initialize Claude Client Package**: ✅
   - Set up Claude API client ✅
   - Implement tool-based interaction ✅
   - Create repository tools ✅
   - Implement autonomous sessions ✅
   - Set up token usage tracking ✅
   - Add prompt caching support ✅
   - Create comprehensive documentation ✅

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

1. **Test Claude Client**:
   - Test the Claude client with real repositories
   - Verify tool-based interaction works correctly
   - Optimize prompt engineering for code analysis
   - Measure token usage and performance

2. **Connect API to Clients**:
   - Integrate GitHub client with API
   - Integrate Claude client with API
   - Set up DynamoDB for persistent storage
   - Implement AWS Batch job submission

3. **Develop Frontend Features**:
   - Job creation form with repository limit
   - Job status monitoring
   - Result visualization
   - Patch file download
   - Claude message thread viewing

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

7. **GitHub Integration**:
   - **Decision**: Using Octokit for API calls and simple-git for repository operations
   - **Rationale**: Provides comprehensive access to GitHub API and Git operations
   - **Considerations**: Need to handle authentication, rate limiting, and error recovery

8. **Package Management**:
   - **Decision**: Using ESLint dependency checks instead of generatePackageJson
   - **Rationale**: Better practice for library packages, avoids deprecated options
   - **Considerations**: Need to configure ESLint rules correctly

9. **Claude Integration**:
   - **Decision**: Using a tool-based approach for Claude interaction
   - **Rationale**: Provides structured interaction with repositories and better control
   - **Considerations**: Need to handle tool execution errors and token usage

### Technical Considerations

1. **GitHub API Integration**:
   - How to handle rate limiting for large repositories
   - Strategies for efficient repository scanning
   - Managing service account credentials securely

2. **Claude 3.7 Integration**:
   - Tool-based interaction for effective code analysis
   - Handling large codebases within token limits
   - Managing autonomous sessions and iteration limits
   - Tracking token usage for cost management

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

4. **Claude Client Integration**:
   - How to integrate the Claude client with the batch processing framework
   - How to handle token usage limits and cost management
   - How to optimize prompt engineering for different types of code analysis