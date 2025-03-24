# Cody Batch

Cody Batch is an AI-powered tool that leverages Claude 3.7 to perform bulk changes on GitHub repositories. It automatically analyzes code and applies changes based on specific prompts, such as updating dependencies, fixing security vulnerabilities, or refactoring code patterns.

## Overview

Cody Batch is designed as a showcase application demonstrating the potential of AI-powered code modification at scale. It serves as both a practical tool for repository maintenance and a demonstration of technical skills aligned with Sourcegraph's vision for AI coding agents.

![Cody Batch Architecture](https://via.placeholder.com/800x400?text=Cody+Batch+Architecture)

## Features

- **Scan GitHub repositories** for patterns based on user-provided prompts
- **Use Claude 3.7** to analyze code and generate changes
- **Automatically create pull requests** for repositories owned by the user (limited to github.com/liamzdenek/*)
- **Generate and store diffs** for download
- **Store and display Claude message threads**
- **Provide a dashboard** to manage jobs and view results
- **Support downloading patch files**
- **Limit to 5 repositories per job** for cost containment

## Architecture

Cody Batch follows a serverless and container-based architecture with the following key components:

- **Web Frontend**: React SPA hosted on S3 with CloudFront distribution
- **API Gateway**: Routes HTTP requests to Lambda functions
- **Lambda API**: Express-based API for job management
- **AWS Batch**: Executes job processing tasks, supporting long-running jobs (>15 minutes)
- **DynamoDB**: Stores job configurations, status, and results
- **GitHub API Integration**: Authenticates with GitHub, clones repositories, creates PRs
- **Claude 3.7 API Integration**: Analyzes code and generates fixes

## Technology Stack

### Frontend
- React with TypeScript
- Tanstack Router (not React Router)
- CSS Modules (no Tailwind or CSS frameworks)
- React Query for data fetching
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- AWS Lambda for API
- AWS Batch for job processing
- DynamoDB for data storage

### Infrastructure
- AWS CDK for infrastructure as code
- S3 for static website hosting
- CloudFront for content delivery
- API Gateway for API management
- IAM for access control

## Project Structure

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

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- AWS CLI configured with appropriate permissions
- GitHub token with repository access
- Claude API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cody-batch.git
   cd cody-batch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env files based on examples
   cp packages/api/.env.example packages/api/.env
   cp packages/batch/.env.example packages/batch/.env
   cp packages/frontend/.env.example packages/frontend/.env
   
   # Edit the .env files with your credentials
   ```

### Deployment

Deploy the entire application with a single command:

```bash
nx run cdk:deploy
```

This comprehensive deployment command:
1. Cleans up previous build artifacts
2. Builds all packages (shared, github-client, claude-client, api, batch, frontend, cdk)
3. Deploys the CDK stack to AWS
4. Builds the Docker image for the batch job
5. Logs in to ECR
6. Tags and pushes the Docker image to ECR
7. Outputs all important URLs and resource names

### Local Development

For local development, you can run individual packages:

```bash
# Run the frontend locally
nx run frontend:serve

# Run the API locally
nx run api:serve

# Test the batch processor locally
nx run batch:test-batch-processor
```

## Usage

1. **Create a Job**:
   - Specify a prompt for code changes
   - Select up to 5 target repositories
   - Choose whether to create pull requests

2. **Monitor Job Progress**:
   - View job status on the dashboard
   - See individual repository processing status

3. **Review Results**:
   - View generated changes as diffs
   - Download patch files
   - Review Claude message threads
   - Check created pull requests

## Monitoring and Operations

### Deployed Resources

The following resources are deployed to AWS:

- CloudFormation Stack: `CodyBatchStack`
- DynamoDB Tables: 
  - `CodyBatchStack-JobsTable1970BC16-13XFSFAMG4F3D`
  - `CodyBatchStack-RepositoriesTable15FA3697-BNQH46SJXX44`
- Lambda Functions: `CodyBatchStack-ApiLambda`
- AWS Batch: 
  - Job Queue: `JobQueue-EEIJwmJX4QNTsUXr`
  - Job Definition: `JobDefinition-Q7XYsqkzhrhXOM5X`
- CloudFront Distribution: `drph83xl8iiin.cloudfront.net`
- API Gateway: `a1p6i4snfc.execute-api.us-west-2.amazonaws.com/prod/`

### Health Checks

Check API health:
```bash
curl https://a1p6i4snfc.execute-api.us-west-2.amazonaws.com/prod/health
```

Check frontend:
```bash
curl -I https://drph83xl8iiin.cloudfront.net
```

### Logs

View API logs:
```bash
aws logs get-log-events --log-group-name /aws/lambda/CodyBatchStack-ApiLambda --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/CodyBatchStack-ApiLambda --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text) --profile lz-demos
```

View Batch job logs:
```bash
aws logs tail /aws/batch/job/job-id-from-aws-batch --follow --profile lz-demos
```

## Limitations

- Limited to 5 repositories per job for cost containment
- Pull request creation limited to repositories matching `github.com/liamzdenek/*`
- Large code files might exceed Claude's context window
- GitHub API rate limits may affect processing of large repositories

## Future Enhancements

- Support for multiple prompt types
- Enhanced result visualization
- Job scheduling
- Improved Claude prompt engineering
- Optimized GitHub API usage
- Enhanced DynamoDB access patterns

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Sourcegraph](https://sourcegraph.com/) for inspiration
- [Claude 3.7](https://www.anthropic.com/) for AI capabilities
- [AWS](https://aws.amazon.com/) for cloud infrastructure
- [GitHub](https://github.com/) for repository hosting and API