# Technical Context: Cody Batch

## Technologies Used

### Frontend
- **React**: UI library for building the web interface
- **TypeScript**: For type-safe code
- **Tanstack Router**: For client-side routing (not React Router)
- **CSS Modules**: For component-scoped styling
- **Zod**: For runtime type validation
- **Axios**: For HTTP requests
- **React Query**: For data fetching and caching

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework for API endpoints
- **TypeScript**: For type-safe code
- **Zod**: For schema validation
- **AWS SDK**: For AWS service integration
- **Anthropic SDK**: For Claude 3.7 API integration
- **Octokit**: For GitHub API integration

### Infrastructure
- **AWS CDK**: For infrastructure as code
- **AWS Lambda**: For API processing
- **AWS Batch**: For job processing
- **API Gateway**: For API management
- **DynamoDB**: For data storage
- **S3**: For static website hosting and artifact storage
- **CloudFront**: For content delivery
- **CloudWatch**: For logging and monitoring
- **IAM**: For access management

### Development Tools
- **Nx**: For monorepo management
- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Jest**: For unit testing
- **AWS CLI**: For AWS resource management
- **curl**: For API testing

## Development Setup

### Monorepo Structure
```
sourcegraph-application/
├── dist/                       # Build output directory
├── packages/
│   ├── frontend/               # React SPA
│   ├── api/                    # Express API for Lambda
│   ├── batch/                  # Job processing for AWS Batch
│   ├── shared/                 # Shared types and utilities
│   ├── github-client/          # GitHub API integration
│   ├── claude-client/          # Claude API integration
│   └── cdk/                    # AWS CDK infrastructure
├── memory-bank/                # Project documentation
├── nx.json                     # Nx configuration
└── package.json                # Root package.json
```

### Package Responsibilities

#### frontend
- User interface for job creation and management
- Result visualization including patch file download
- Claude message thread viewing
- Error handling and user feedback

#### api
- REST API endpoints
- Job management
- AWS Batch job submission
- Input validation

#### batch
- Job processing logic
- Repository analysis
- Integration with Claude 3.7
- Pull request creation
- Patch file generation

#### shared
- Common types
- Utility functions
- Constants
- Schema definitions

#### github-client
- GitHub API integration
- Repository operations
- Service account authentication
- Rate limit management

#### claude-client
- Claude 3.7 API integration
- Prompt engineering
- Response parsing
- Message thread management

#### cdk
- Infrastructure definition
- Deployment scripts
- Environment configuration
- Resource management

## Technical Constraints

### AWS Batch Limitations
- **Compute Environment**: Need to configure appropriate instance types
- **Job Queue**: Need to manage job priorities and scheduling
- **Container Images**: Need to build and maintain Docker images
- **Job Definitions**: Need to define memory, CPU, and environment requirements

### GitHub API Limitations
- **Rate Limits**: 5,000 requests per hour for authenticated requests
- **Content Limitations**: Maximum file size and repository size limits
- **Service Account**: Need appropriate permissions for repository access and PR creation

### Claude 3.7 API Limitations
- **Token Limits**: Maximum context window size
- **Rate Limits**: Requests per minute/hour
- **Cost**: Pay-per-token pricing model
- **Response Quality**: Varies based on prompt engineering

### DynamoDB Constraints
- **Item Size**: Maximum 400KB per item
- **Query Limitations**: Limited query flexibility compared to SQL
- **Throughput**: Need to manage read/write capacity

## Dependencies

### External Services
- **GitHub API**: For repository access and PR creation
- **Claude 3.7 API**: For code analysis and fix generation
- **AWS Services**: For infrastructure and runtime

### Critical Libraries
- **@aws-sdk/client-dynamodb**: For DynamoDB access
- **@aws-sdk/client-batch**: For AWS Batch job submission
- **@anthropic-ai/sdk**: For Claude API access
- **@octokit/rest**: For GitHub API access
- **express**: For API routing
- **zod**: For schema validation
- **react**: For UI components
- **@tanstack/router**: For client-side routing

### Development Dependencies
- **typescript**: For static type checking
- **nx**: For monorepo management
- **jest**: For testing
- **esbuild**: For bundling
- **aws-cdk-lib**: For infrastructure as code
- **docker**: For container image building

## Environment Configuration

### Required Environment Variables
- **GITHUB_TOKEN**: Service account token for GitHub
- **CLAUDE_API_KEY**: API key for Claude 3.7
- **AWS_REGION**: AWS region for deployments
- **ALLOWED_REPOSITORIES**: Comma-separated list of allowed repository patterns (e.g., "liamzdenek/*")

### AWS Resource Configuration
- **DynamoDB Tables**: Jobs, Results, Repositories
- **Lambda Functions**: API
- **AWS Batch**: Compute Environment, Job Queue, Job Definition
- **S3 Buckets**: Frontend hosting, artifact storage
- **CloudFront Distribution**: For frontend delivery
- **IAM Roles**: For service permissions

## Deployment Strategy

### Infrastructure Deployment
- Use AWS CDK for infrastructure definition
- Deploy infrastructure changes before application updates
- Use CloudFormation for resource provisioning

### Application Deployment
- Build applications outside of CDK
- Package Lambda functions with dependencies
- Build Docker images for AWS Batch jobs
- Upload frontend assets to S3 using BucketDeployment

### Environment Management
- Use environment variables for configuration
- Pass environment variables to AWS Batch jobs
- Use parameter references in CDK

## Operational Considerations

### Monitoring
- CloudWatch Logs for application logs
- CloudWatch Metrics for performance monitoring
- CloudWatch Alarms for critical issues
- AWS Batch job monitoring

### Debugging
- Comprehensive logging throughout the application
- Health check endpoints for service status
- Debug mode for detailed logging
- AWS Batch job logs for job processing

### Security
- IAM roles with least privilege
- HTTPS for all communications
- Secure handling of service account tokens
- Input validation for all user inputs
- Repository access limited to specified patterns

## Data Management

### Storage Strategy
- **Job Data**: Stored in DynamoDB
- **Patch Files**: Stored in DynamoDB (for smaller diffs) or S3 (for larger diffs)
- **Claude Messages**: Stored in DynamoDB
- **Pull Request Links**: Stored in DynamoDB

### Backup Strategy
- DynamoDB point-in-time recovery
- S3 versioning for frontend assets
- Infrastructure as code for disaster recovery

### Data Retention
- Job data retained for 30 days
- Patch files retained for 30 days
- Claude messages retained for 30 days
- Pull request links retained indefinitely

## Performance Considerations

### Optimization Strategies
- Efficient DynamoDB access patterns
- Parallel processing of repositories
- Optimized Claude prompts
- CloudFront caching for frontend assets

### Scaling Considerations
- AWS Batch compute environment scaling
- DynamoDB auto-scaling
- API Gateway throttling
- Repository limit (5 per job) for cost containment

### Cost Management
- Monitor AWS Batch compute usage
- Optimize Claude API token usage
- Use DynamoDB on-demand capacity
- Set budget alerts for AWS resources