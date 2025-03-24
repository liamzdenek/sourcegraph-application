# System Patterns: Cody Batch

## System Architecture

Cody Batch follows a serverless, event-driven architecture with the following key components:

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
│  DynamoDB       │◀───▶│  Lambda Worker  │◀───▶│  GitHub API     │
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
   - Result visualization
   - Authentication with GitHub
   - Hosted on S3 with CloudFront distribution

2. **API Gateway**
   - Routes HTTP requests to appropriate Lambda functions
   - Handles request validation
   - Manages API versioning

3. **Lambda API (Express)**
   - Processes API requests
   - Manages job creation and status updates
   - Handles GitHub OAuth flow
   - Validates input data using Zod

4. **Lambda Worker**
   - Executes job processing tasks
   - Clones and analyzes repositories
   - Coordinates with Claude 3.7 API
   - Creates pull requests or generates diffs
   - Handles retries and error recovery

5. **DynamoDB**
   - Stores job configurations and status
   - Tracks processing results
   - Maintains repository metadata
   - Stores generated diffs and PR links

6. **GitHub API Integration**
   - Authenticates with GitHub
   - Clones repositories
   - Creates branches and pull requests
   - Fetches repository metadata

7. **Claude 3.7 API Integration**
   - Sends code analysis requests
   - Processes AI-generated fixes
   - Validates generated code

## Key Technical Decisions

### Serverless Architecture
- **Decision**: Use AWS Lambda for all backend processing
- **Rationale**: Provides automatic scaling, reduced operational overhead, and cost efficiency for bursty workloads
- **Implications**: Need to manage cold starts, function timeouts, and stateless processing

### Event-Driven Processing
- **Decision**: Use event-based communication between components
- **Rationale**: Enables loose coupling, better scalability, and resilience
- **Implications**: Need to handle event ordering, idempotency, and failure recovery

### DynamoDB as Primary Datastore
- **Decision**: Use DynamoDB for all persistent data
- **Rationale**: Serverless, scalable, and provides consistent performance
- **Implications**: Need to design efficient access patterns and manage costs

### GitHub OAuth Integration
- **Decision**: Use GitHub OAuth for authentication and API access
- **Rationale**: Provides secure access to repositories with proper permissions
- **Implications**: Need to handle token storage, refresh, and permission scopes

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
- Used for different fix strategies
- Allows swapping algorithms for different vulnerability types
- Enables extension without modifying core code

### Observer Pattern
- Used for job status updates
- Notifies interested components about job progress
- Decouples job processing from status reporting

## Component Relationships

### Data Flow
1. User creates job through frontend
2. API Lambda validates and stores job in DynamoDB
3. Worker Lambda polls for new jobs or is triggered by events
4. Worker processes job, interacting with GitHub and Claude APIs
5. Results are stored in DynamoDB
6. Frontend displays results to user

### Communication Patterns
- **Frontend to API**: REST API calls via API Gateway
- **API to Worker**: Event-based triggering via SQS or direct invocation
- **Worker to External APIs**: HTTP requests with appropriate authentication
- **Components to DynamoDB**: Direct access via AWS SDK

### Error Handling
- Each component handles its own errors
- Errors are logged and stored with jobs
- Retryable operations use exponential backoff
- Critical failures trigger notifications

## Scalability Considerations

### Horizontal Scaling
- Lambda functions scale automatically based on demand
- DynamoDB scales read/write capacity as needed

### Performance Optimization
- Use DynamoDB GSIs for efficient queries
- Implement caching for frequently accessed data
- Optimize GitHub API usage to avoid rate limiting

### Cost Management
- Monitor and optimize Lambda execution time
- Use provisioned capacity for predictable DynamoDB workloads
- Implement Claude API usage tracking and limits