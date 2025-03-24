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
- **AWS Lambda**: For serverless compute
- **API Gateway**: For API management
- **DynamoDB**: For data storage
- **S3**: For static website hosting
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
│   ├── worker/                 # Job processing Lambda
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
- Authentication with GitHub
- Result visualization
- Error handling and user feedback

#### api
- REST API endpoints
- Job management
- GitHub OAuth flow
- Input validation

#### worker
- Job processing logic
- Repository analysis
- Integration with Claude 3.7
- Pull request creation

#### shared
- Common types
- Utility functions
- Constants
- Schema definitions

#### github-client
- GitHub API integration
- Repository operations
- Authentication handling
- Rate limit management

#### claude-client
- Claude 3.7 API integration
- Prompt engineering
- Response parsing
- Error handling

#### cdk
- Infrastructure definition
- Deployment scripts
- Environment configuration
- Resource management

## Technical Constraints

### AWS Lambda Limitations
- **Execution Time**: Maximum 15 minutes per invocation
- **Memory**: Up to 10GB RAM
- **Deployment Package**: Maximum 50MB zipped, 250MB unzipped
- **Temporary Storage**: 512MB to 10GB in /tmp directory

### GitHub API Limitations
- **Rate Limits**: 5,000 requests per hour for authenticated requests
- **Content Limitations**: Maximum file size and repository size limits
- **OAuth Scope**: Need appropriate scopes for repository access and PR creation

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
- **@aws-sdk/client-lambda**: For Lambda invocation
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

## Environment Configuration

### Required Environment Variables
- **GITHUB_CLIENT_ID**: OAuth client ID for GitHub
- **GITHUB_CLIENT_SECRET**: OAuth client secret for GitHub
- **CLAUDE_API_KEY**: API key for Claude 3.7
- **AWS_REGION**: AWS region for deployments
- **ALLOWED_REPOSITORIES**: Comma-separated list of allowed repository patterns (e.g., "liamzdenek/*")

### AWS Resource Configuration
- **DynamoDB Tables**: Jobs, Results, Repositories
- **Lambda Functions**: API, Worker
- **S3 Buckets**: Frontend hosting, temporary storage
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
- Upload frontend assets to S3
- Update CloudFront distribution

### Environment Management
- Use environment variables for configuration
- Store secrets in AWS Secrets Manager
- Use parameter references in CDK

## Operational Considerations

### Monitoring
- CloudWatch Logs for application logs
- CloudWatch Metrics for performance monitoring
- CloudWatch Alarms for critical issues

### Debugging
- Comprehensive logging throughout the application
- Health check endpoints for service status
- Debug mode for detailed logging

### Security
- IAM roles with least privilege
- HTTPS for all communications
- Secure storage of OAuth tokens
- Input validation for all user inputs