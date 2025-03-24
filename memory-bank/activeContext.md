# Active Context: Cody Batch

## Current Work Focus

We are in the implementation phase of the Cody Batch project. The primary focus is on:

1. **Core Component Implementation**: Implementing the key components of the system
2. **Claude Client Development**: Building the Claude client for AI code analysis
3. **Batch Processing Framework**: Implementing the batch processing framework
4. **Frontend Development**: Implementing the frontend components
5. **Integration**: Integrating all components
6. **Testing**: Testing the system
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

14. **Claude Client Enhancements**: Added direct API calls with improved error handling, detailed logging, and path resolution for repository tools.

15. **Test Repository Creation**: Created a test repository with a vulnerable Log4j dependency for validating Claude client functionality.

16. **Runbook Updates**: Added comprehensive Claude client troubleshooting procedures to the runbook.

17. **Claude API Integration Learnings**: Discovered several important architectural adjustments needed for Claude API integration:
    - Claude 3.7 models require the Messages API, not the Completions API
    - Claude 3.7 has a maximum token limit of 64,000 tokens
    - Path resolution requires careful validation for repository operations
    - Claude API has rate limits that need to be respected
    - Need more robust error handling for API calls

18. **Conversation History Storage Gap**: Identified a gap in how we're storing Claude conversation history:
    - Current DynamoDB schema only stores `finalMessage` and `threadId`
    - Frontend expects full conversation history with all messages and timestamps
    - Need to store tool calls and results for complete understanding of AI reasoning

19. **Batch Package Implementation**: Implemented the batch package with job and repository processing:
    - Created job processor for orchestrating batch jobs
    - Implemented repository processor for handling individual repositories
    - Added DynamoDB client for persistent storage
    - Implemented conversation formatting for storage
    - Created test script for running the batch processor locally
    - Added comprehensive error handling and logging

20. **Frontend Implementation**: Implemented the frontend components:
    - Created API service layer for interacting with the backend API
    - Implemented ApiContext provider using React Context API and React Query
    - Created components for dashboard, repositories list, jobs list, job details, repository details, and create job
    - Implemented routing with Tanstack Router
    - Added CSS modules for component-specific styling
    - Implemented global CSS variables for consistent styling
    - Added responsive design for mobile and desktop

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
   - Implement direct API calls with error handling ✅
   - Add detailed logging for API interactions ✅
   - Create test repository for validation ✅

5. **Update Claude Client for Conversation Storage**: ✅
   - Add timestamps to each message in the conversation history ✅
   - Format roles consistently as "human"/"assistant" instead of "user"/"assistant" ✅
   - Create a method to convert internal conversation format to API response format ✅
   - Add type field to distinguish between regular messages, tool calls, and tool results ✅

6. **Update DynamoDB Schema**: ✅
   - Replace simple `claudeMessages` map with a comprehensive `claudeConversation` structure ✅
   - Add support for storing tool calls and results ✅
   - Add detailed token usage tracking fields ✅

7. **Update API Contract**: ✅
   - Update Claude message thread endpoint to include tool interactions ✅
   - Add formatting options for different view modes ✅
   - Ensure efficient retrieval of potentially large conversation histories ✅

8. **Initialize API Package**: ✅
   - Set up Express application ✅
   - Configure Lambda handler ✅
   - Create health check endpoint ✅
   - Set up job management endpoints ✅
   - Set up error handling and logging ✅

9. **Initialize Batch Package**: ✅
   - Set up package structure ✅
   - Create job processing framework ✅
   - Set up GitHub API integration ✅
   - Set up Claude API integration ✅
   - Implement conversation history storage ✅
   - Create test script for local testing ✅

10. **Initialize Frontend Package**: ✅
    - Set up React application with Vite ✅
    - Configure Tanstack Router ✅
    - Create basic layout and navigation ✅
    - Implement API service layer ✅
    - Create ApiContext provider ✅
    - Implement components for dashboard, repositories, jobs, and settings ✅
    - Add CSS modules for component-specific styling ✅
    - Implement global CSS variables ✅
    - Add responsive design ✅

11. **Initialize CDK Package**: ✅
    - Set up package structure ✅
    - Define AWS resources
    - Configure deployment

### Short-Term Goals (Next Week)

1. **Test Claude Client**: ✅
   - Test the Claude client with real repositories ✅
   - Verify tool-based interaction works correctly ✅
   - Optimize prompt engineering for code analysis ✅
   - Measure token usage and performance ✅
   - Implement error handling and debugging ✅

2. **Test Batch Package**:
   - Test the batch processor with real repositories
   - Verify job and repository processing
   - Test conversation formatting and storage
   - Measure performance and resource usage
   - Implement error handling and recovery

3. **Connect API to Batch**:
   - Set up DynamoDB tables for jobs and repositories
   - Configure AWS Batch compute environment and job queue
   - Implement AWS Batch job submission from API
   - Test end-to-end job processing

4. **Test Frontend Features**:
   - Test job creation form with repository limit
   - Test job status monitoring
   - Test result visualization
   - Test patch file download
   - Test Claude message thread viewing with technical and simplified views

5. **Deploy Initial Version**:
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

10. **Claude API Access**:
    - **Decision**: Using direct API calls with fetch instead of relying solely on the SDK
    - **Rationale**: Provides better error handling, debugging, and compatibility with newer models
    - **Considerations**: Need to manage API versioning and headers correctly

11. **Conversation History Storage**:
    - **Decision**: Using a comprehensive structure to store the full conversation including tool calls
    - **Rationale**: Provides complete context for understanding AI reasoning and debugging
    - **Considerations**: Need to manage potentially large conversation histories efficiently

12. **Batch Processing**:
    - **Decision**: Using a job processor and repository processor for batch processing
    - **Rationale**: Provides clear separation of concerns and better error isolation
    - **Considerations**: Need to manage concurrency and resource usage

13. **Frontend Architecture**:
    - **Decision**: Using React Context API and React Query for state management
    - **Rationale**: Provides efficient data fetching, caching, and state management
    - **Considerations**: Need to handle loading and error states consistently

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
   - Handling API errors and rate limits
   - Path resolution for repository tools
   - Storing and retrieving complete conversation histories

3. **Job Processing**:
   - Handling long-running jobs with AWS Batch
   - Implementing retry and error recovery mechanisms
   - Managing parallel processing for efficiency
   - Storing large conversation histories efficiently
   - Implementing concurrency limits for repository processing

4. **Security Considerations**:
   - Securing GitHub service account credentials
   - Limiting repository access to specified patterns
   - Protecting against injection attacks in generated code
   - Securing Claude API keys

5. **Frontend Rendering**:
   - How to display complex tool interactions in a user-friendly way
   - Providing both technical and simplified views of conversations
   - Handling large conversation histories efficiently
   - Implementing responsive design for different screen sizes

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
   - How to display tool interactions in a user-friendly way

4. **Claude Client Integration**:
   - How to integrate the Claude client with the batch processing framework
   - How to handle token usage limits and cost management
   - How to optimize prompt engineering for different types of code analysis
   - How to handle different Claude models and API versions
   - How to implement robust error handling and recovery
   - How to efficiently store and retrieve large conversation histories

5. **Testing Strategy**:
   - How to test the Claude client without incurring excessive API costs
   - How to create representative test repositories
   - How to validate the correctness of code changes
   - How to simulate error conditions and edge cases
   - How to test conversation history storage and retrieval
   - How to test the batch processor without AWS Batch
   - How to test the frontend without a backend