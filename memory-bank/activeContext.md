# Active Context: Cody Batch

## Current Work Focus

We are in the initial planning and setup phase of the Cody Batch project. The primary focus is on:

1. **Project Structure Definition**: Establishing the Nx monorepo structure and package organization
2. **Core Architecture Design**: Defining the system components and their interactions
3. **Infrastructure Setup**: Creating the AWS CDK configuration for deployment
4. **Initial Frontend Scaffold**: Setting up the React application with Tanstack Router
5. **Initial Backend Scaffold**: Setting up the Express API for Lambda deployment

## Recent Changes

As this is the project initialization phase, there are no recent changes to track yet. The memory bank documentation is being created to establish the project foundation.

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
   - Configure Lambda functions
   - Set up API Gateway
   - Create S3 bucket for frontend hosting
   - Configure CloudFront distribution

4. **Initialize API Package**:
   - Set up Express application
   - Configure Lambda handler
   - Create basic health check endpoint
   - Set up GitHub OAuth flow

5. **Initialize Worker Package**:
   - Create job processing framework
   - Set up GitHub API integration
   - Set up Claude API integration
   - Implement basic job handling logic

6. **Initialize Frontend Package**:
   - Set up React application
   - Configure Tanstack Router
   - Create basic layout and navigation
   - Implement authentication flow

### Short-Term Goals (Next Week)

1. **Implement Core Job Processing**:
   - Repository scanning
   - Basic code analysis
   - Integration with Claude 3.7
   - Pull request creation for owned repositories

2. **Develop Frontend Features**:
   - Job creation form
   - Job status monitoring
   - Result visualization
   - Repository selection

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
   - Support for multiple vulnerability types
   - Batch job processing
   - Enhanced result visualization
   - Job scheduling

2. **Optimize Performance**:
   - Improve Claude prompt engineering
   - Optimize GitHub API usage
   - Enhance DynamoDB access patterns
   - Reduce Lambda cold start impact

3. **Enhance User Experience**:
   - Improve error messaging
   - Add progress indicators
   - Implement result filtering and search
   - Add user preferences

## Active Decisions and Considerations

### Architecture Decisions

1. **Serverless vs. Container-Based**:
   - **Decision**: Using serverless architecture with AWS Lambda
   - **Rationale**: Better scalability, lower operational overhead, cost efficiency for bursty workloads
   - **Considerations**: Need to manage cold starts and execution time limits

2. **Monolithic vs. Microservices**:
   - **Decision**: Using a microservices approach with separate API and Worker Lambdas
   - **Rationale**: Better separation of concerns, independent scaling, and deployment
   - **Considerations**: Need to manage inter-service communication and consistency

3. **Data Storage Strategy**:
   - **Decision**: Using DynamoDB as the primary datastore
   - **Rationale**: Serverless, scalable, and consistent performance
   - **Considerations**: Need to design efficient access patterns and manage costs

### Technical Considerations

1. **GitHub API Integration**:
   - How to handle rate limiting for large repositories
   - Strategies for efficient repository scanning
   - Managing OAuth token security and refresh

2. **Claude 3.7 Integration**:
   - Prompt engineering for effective code analysis
   - Handling large codebases within token limits
   - Validating generated fixes for correctness

3. **Job Processing**:
   - Handling long-running jobs within Lambda constraints
   - Implementing retry and error recovery mechanisms
   - Managing parallel processing for efficiency

4. **Security Considerations**:
   - Securing GitHub OAuth tokens
   - Limiting repository access to specified patterns
   - Protecting against injection attacks in generated code

### Open Questions

1. **Scope Limitations**:
   - What specific vulnerability types should be supported initially?
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