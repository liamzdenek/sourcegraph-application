# System Patterns: Cody Batch

## System Architecture

Cody Batch follows a serverless and container-based architecture with the following key components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Frontend   │────▶│  API Gateway    │────▶│  Lambda API     │
│  (React SPA)    │     │                 │     │  (Express)      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  DynamoDB       │◀───▶│  AWS Batch      │◀───▶│  GitHub API     │
│  (Data Store)   │     │  (Job Processor)│     │  Integration    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │  Claude 3.7 API │
                        │  Integration    │
                        │                 │
                        └─────────────────┘
```

### Component Responsibilities

1. **Web Frontend (React SPA)**
   - User interface for job creation and management
   - Result visualization including patch file download
   - Claude message thread viewing
   - Hosted on S3 with CloudFront distribution

2. **API Gateway**
   - Routes HTTP requests to appropriate Lambda functions
   - Handles request validation
   - Manages API versioning

3. **Lambda API (Express)**
   - Processes API requests
   - Manages job creation and status updates
   - Validates input data using Zod
   - Submits jobs to AWS Batch

4. **AWS Batch Job Processor**
   - Executes job processing tasks
   - Clones and analyzes repositories
   - Coordinates with Claude 3.7 API
   - Creates pull requests or generates diffs
   - Handles retries and error recovery
   - Supports long-running jobs (>15 minutes)

5. **DynamoDB**
   - Stores job configurations and status
   - Tracks processing results
   - Maintains repository metadata
   - Stores generated diffs, PR links, and Claude message threads

6. **GitHub API Integration**
   - Authenticates with GitHub using service account
   - Clones repositories
   - Creates branches and pull requests
   - Fetches repository metadata

7. **Claude 3.7 API Integration**
   - Sends code analysis requests
   - Processes AI-generated fixes
   - Validates generated code
   - Stores message threads

## Key Technical Decisions

### Mixed Serverless and Container Architecture
- **Decision**: Use AWS Lambda for API and AWS Batch for job processing
- **Rationale**: Lambda for quick API responses, Batch for longer-running jobs
- **Implications**: Need to manage container images, compute environments, and job queues

### Event-Driven Processing
- **Decision**: Use event-based communication between components
- **Rationale**: Enables loose coupling, better scalability, and resilience
- **Implications**: Need to handle event ordering, idempotency, and failure recovery

### DynamoDB as Primary Datastore
- **Decision**: Use DynamoDB for all persistent data
- **Rationale**: Serverless, scalable, and provides consistent performance
- **Implications**: Need to design efficient access patterns and manage costs

### Service Account Authentication
- **Decision**: Use GitHub service account for authentication and API access
- **Rationale**: Simplifies authentication flow and aligns with real-world usage
- **Implications**: Need to manage credential security and rotation

### Claude 3.7 for Code Analysis
- **Decision**: Use Claude 3.7 API for code analysis and fix generation
- **Rationale**: Provides advanced code understanding and generation capabilities
- **Implications**: Need to manage API costs, handle rate limits, and design effective prompts

## Design Patterns

### Repository Pattern
- Used for data access abstraction
- Provides consistent interface for DynamoDB operations
- Simplifies testing and maintenance

### Command Pattern
- Used for job processing
- Encapsulates job logic in discrete command objects
- Enables retry, rollback, and monitoring

### Factory Pattern
- Used for creating job processors
- Selects appropriate processor based on job type
- Simplifies adding new job types

### Strategy Pattern
- Used for different prompt strategies
- Allows swapping algorithms for different code modification types
- Enables extension without modifying core code

### Observer Pattern
- Used for job status updates
- Notifies interested components about job progress
- Decouples job processing from status reporting

## Component Relationships

### Data Flow
1. User creates job through frontend
2. API Lambda validates and stores job in DynamoDB
3. API Lambda submits job to AWS Batch
4. Batch job processor executes job, interacting with GitHub and Claude APIs
5. Results are stored in DynamoDB
6. Frontend displays results to user, including patch files and Claude messages

### Communication Patterns
- **Frontend to API**: REST API calls via API Gateway
- **API to Batch**: AWS Batch job submission
- **Batch to External APIs**: HTTP requests with appropriate authentication
- **Components to DynamoDB**: Direct access via AWS SDK

### Error Handling
- Each component handles its own errors
- Errors are logged and stored with jobs
- Retryable operations use exponential backoff
- Critical failures trigger notifications

## Scalability Considerations

### Horizontal Scaling
- Lambda functions scale automatically based on demand
- AWS Batch scales compute resources based on job queue
- DynamoDB scales read/write capacity as needed

### Performance Optimization
- Use DynamoDB GSIs for efficient queries
- Implement caching for frequently accessed data
- Optimize GitHub API usage to avoid rate limiting
- Limit to 5 repositories per job for cost containment

### Cost Management
- Monitor and optimize Lambda execution time
- Manage AWS Batch compute resources efficiently
- Use provisioned capacity for predictable DynamoDB workloads
- Implement Claude API usage tracking and limits

## Data Persistence

### Job Data
- Job configurations and status stored in DynamoDB
- Job results including repository status and changes
- Pull request links for successful PRs

### Result Artifacts
- Patch files stored for download
- Claude message threads preserved for review
- Repository analysis details

### Caching Strategy
- Cache repository metadata to reduce GitHub API calls
- Cache common Claude prompts and responses
- Use CloudFront caching for frontend assets

## Security Model

### Authentication
- Service account credentials for GitHub API access
- API keys for Claude API access
- No user authentication required for frontend

### Authorization
- Repository access limited to specified patterns (github.com/liamzdenek/*)
- Job operations limited to repositories within allowed patterns
- Pull request creation restricted to owned repositories

### Secrets Management
- Service account credentials stored as environment variables
- API keys passed as environment variables
- No AWS Secrets Manager dependency

## Deployment Model

### Infrastructure as Code
- AWS CDK for all infrastructure definition
- S3 BucketDeployment for frontend with automatic invalidation
- AWS Batch compute environment and job queue configuration

### CI/CD Pipeline
- Automated build and deployment process
- Environment-specific configurations
- Deployment validation checks