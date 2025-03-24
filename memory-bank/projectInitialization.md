# Project Initialization Guide

This document outlines the steps to initialize the Cody Batch project. It provides a detailed, step-by-step approach to setting up the project structure, configuring the development environment, and preparing for implementation.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v8 or later)
- AWS CLI (configured with appropriate credentials)
- Git

## Step 1: Initialize the Nx Workspace

```bash
# Create the .gitignore file first
cat > .gitignore << EOF
# Nx
.nx/installation
.nx/cache
.nx/workspace-data

# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Testing
coverage/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS files
.DS_Store
Thumbs.db

# AWS CDK
cdk.out/
.cdk.staging/
cdk-outputs.json

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Temporary files
tmp/
temp/
.tmp/

# Claude API key files
.claude-key
claude-key.json

# GitHub OAuth credentials
.github-oauth
github-oauth.json
EOF

# Initialize the Nx workspace
npx create-nx-workspace@latest cody-batch --preset=ts --nx-cloud=false
cd cody-batch

# Update nx.json to configure output paths
cat > nx.json << EOF
{
  "installation": {
    "version": "20.6.2"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
EOF
```

## Step 2: Create Package Structure

```bash
# Create shared package
nx generate @nx/js:library shared --directory=packages/shared --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create github-client package
nx generate @nx/js:library github-client --directory=packages/github-client --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create claude-client package
nx generate @nx/js:library claude-client --directory=packages/claude-client --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create API package
nx generate @nx/node:application api --directory=packages/api --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create worker package
nx generate @nx/node:application worker --directory=packages/worker --bundler=esbuild --unitTestRunner=jest --no-interactive

# Create frontend package
nx generate @nx/react:application frontend --directory=packages/frontend --bundler=webpack --unitTestRunner=jest --style=css --routing=false --no-interactive

# Create CDK package
nx generate @nx/node:application cdk --directory=packages/cdk --bundler=esbuild --unitTestRunner=jest --no-interactive
```

## Step 3: Configure TypeScript

```bash
# Update root tsconfig.json
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "es2015",
    "module": "esnext",
    "lib": ["es2020", "dom"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@cody-batch/shared": ["packages/shared/src/index.ts"],
      "@cody-batch/github-client": ["packages/github-client/src/index.ts"],
      "@cody-batch/claude-client": ["packages/claude-client/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
EOF
```

## Step 4: Install Core Dependencies

```bash
# Install shared dependencies
npm install --save zod @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb

# Install API dependencies
npm install --save express @types/express cors @types/cors helmet cookie-parser @types/cookie-parser dotenv

# Install GitHub client dependencies
npm install --save @octokit/rest @octokit/auth-oauth-app

# Install Claude client dependencies
npm install --save @anthropic-ai/sdk

# Install frontend dependencies
npm install --save @tanstack/react-router @tanstack/react-query axios

# Install CDK dependencies
npm install --save aws-cdk-lib constructs
npm install --save-dev aws-cdk
```

## Step 5: Configure Shared Package

Create the basic types and utilities in the shared package:

```bash
# Create basic types
cat > packages/shared/src/lib/types/index.ts << EOF
export * from './job';
export * from './repository';
export * from './user';
EOF

# Create job types
cat > packages/shared/src/lib/types/job.ts << EOF
import { z } from 'zod';

export const JobStatusEnum = z.enum([
  'pending',
  'in-progress',
  'completed',
  'failed',
  'cancelled'
]);

export type JobStatus = z.infer<typeof JobStatusEnum>;

export const JobTypeEnum = z.enum([
  'vulnerability-fix',
  'dependency-update',
  'code-pattern-update'
]);

export type JobType = z.infer<typeof JobTypeEnum>;

export const JobParametersSchema = z.object({
  vulnerability: z.string().optional(),
  targetVersion: z.string().optional(),
  pattern: z.string().optional(),
  replacement: z.string().optional()
});

export type JobParameters = z.infer<typeof JobParametersSchema>;

export const CreateJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: JobTypeEnum,
  parameters: JobParametersSchema,
  repositories: z.array(z.string().min(1)),
  createPullRequests: z.boolean().default(true)
});

export type CreateJobRequest = z.infer<typeof CreateJobSchema>;

export const JobSchema = CreateJobSchema.extend({
  jobId: z.string(),
  status: JobStatusEnum,
  createdAt: z.number(),
  createdBy: z.string(),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  error: z.string().optional()
});

export type Job = z.infer<typeof JobSchema>;
EOF

# Create repository types
cat > packages/shared/src/lib/types/repository.ts << EOF
import { z } from 'zod';
import { JobStatusEnum } from './job';

export const RepositorySchema = z.object({
  jobId: z.string(),
  repositoryName: z.string(),
  status: JobStatusEnum,
  pullRequestUrl: z.string().optional(),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  changes: z.array(
    z.object({
      file: z.string(),
      diff: z.string()
    })
  ).optional(),
  analysisDetails: z.object({
    vulnerabilityDetected: z.boolean().optional(),
    affectedFiles: z.number().optional(),
    claudePromptTokens: z.number().optional(),
    claudeResponseTokens: z.number().optional()
  }).optional(),
  logs: z.array(
    z.object({
      timestamp: z.number(),
      level: z.string(),
      message: z.string()
    })
  ).optional(),
  error: z.string().optional()
});

export type Repository = z.infer<typeof RepositorySchema>;
EOF

# Create user types
cat > packages/shared/src/lib/types/user.ts << EOF
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  login: z.string(),
  name: z.string().optional(),
  avatarUrl: z.string().optional()
});

export type User = z.infer<typeof UserSchema>;
EOF

# Create utilities
cat > packages/shared/src/lib/utils/index.ts << EOF
export * from './logger';
export * from './validation';
EOF

# Create logger utility
cat > packages/shared/src/lib/utils/logger.ts << EOF
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  constructor(private context: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta
    };
    
    console.log(JSON.stringify(logEntry));
  }
}
EOF

# Create validation utility
cat > packages/shared/src/lib/utils/validation.ts << EOF
import { ZodError, ZodSchema } from 'zod';
import { Logger } from './logger';

const logger = new Logger('Validation');

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      
      logger.error('Validation error', error as Error, { errors });
      throw new ValidationError('Validation failed', errors);
    }
    
    throw error;
  }
}
EOF

# Update index.ts
cat > packages/shared/src/index.ts << EOF
export * from './lib/types';
export * from './lib/utils';
EOF
```

## Step 6: Configure CDK Package

```bash
# Create CDK app
cat > packages/cdk/src/main.ts << EOF
#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { CodyBatchStack } from './lib/cody-batch-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

new CodyBatchStack(app, 'CodyBatchStack', {
  env,
  stackName: 'cody-batch',
  description: 'Cody Batch - AI-powered repository remediation'
});
EOF

# Create CDK stack
mkdir -p packages/cdk/src/lib
cat > packages/cdk/src/lib/cody-batch-stack.ts << EOF
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class CodyBatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      tableName: 'cody-batch-jobs',
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    jobsTable.addGlobalSecondaryIndex({
      indexName: 'createdBy-createdAt-index',
      partitionKey: { name: 'createdBy', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
    });

    const repositoriesTable = new dynamodb.Table(this, 'RepositoriesTable', {
      tableName: 'cody-batch-repositories',
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'repositoryName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Lambda Functions
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      functionName: 'cody-batch-api',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist/packages/api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: 'production',
        JOBS_TABLE: jobsTable.tableName,
        REPOSITORIES_TABLE: repositoriesTable.tableName,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
        ALLOWED_REPOSITORIES: 'liamzdenek/*'
      },
    });

    const workerLambda = new lambda.Function(this, 'WorkerLambda', {
      functionName: 'cody-batch-worker',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist/packages/worker')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      environment: {
        NODE_ENV: 'production',
        JOBS_TABLE: jobsTable.tableName,
        REPOSITORIES_TABLE: repositoriesTable.tableName,
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || 'dummy-api-key',
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
        ALLOWED_REPOSITORIES: 'liamzdenek/*'
      },
    });

    // Grant permissions
    jobsTable.grantReadWriteData(apiLambda);
    repositoriesTable.grantReadWriteData(apiLambda);
    jobsTable.grantReadWriteData(workerLambda);
    repositoriesTable.grantReadWriteData(workerLambda);
    workerLambda.grantInvoke(apiLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'CodyBatchApi', {
      restApiName: 'Cody Batch API',
      description: 'API for Cody Batch',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiLambda);
    api.root.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,
    });

    // Frontend hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'cody-batch-frontend',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'Access to the frontend bucket',
    });

    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [frontendBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: \`https://\${distribution.distributionDomainName}\`,
      description: 'Frontend URL',
    });
  }
}
EOF
```

## Step 7: Configure API Package

```bash
# Create API Lambda handler
cat > packages/api/src/main.ts << EOF
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger } from '@cody-batch/shared';
import { createServer, proxy } from 'aws-serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';

// Routes
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { jobsRouter } from './routes/jobs';
import { repositoriesRouter } from './routes/repositories';

const logger = new Logger('API');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: '*', // Update with actual frontend URL in production
  credentials: true,
}));
app.use(helmet());

// Request logging
app.use((req, res, next) => {
  logger.info(\`\${req.method} \${req.path}\`, {
    query: req.query,
    headers: req.headers,
    ip: req.ip,
  });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);
app.use('/repositories', repositoriesRouter);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    });
  }
  
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// Create server
const server = createServer(app);

// Lambda handler
export const handler: APIGatewayProxyHandler = (event, context) => {
  logger.debug('Lambda event', { event });
  return proxy(server, event, context);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(\`API server listening on port \${PORT}\`);
  });
}
EOF

# Create health route
mkdir -p packages/api/src/routes
cat > packages/api/src/routes/health.ts << EOF
import { Router } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Logger } from '@cody-batch/shared';

const router = Router();
const logger = new Logger('HealthRoute');

// DynamoDB client for health check
const dynamoDb = new DynamoDBClient({});

router.get('/', async (req, res) => {
  logger.debug('Health check requested');
  
  try {
    // Check DynamoDB connection
    await dynamoDb.send({ 
      '$metadata': { 
        'httpStatusCode': 200 
      } 
    });
    
    // Return health status
    res.json({
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        dynamodb: 'healthy',
      }
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    
    res.status(500).json({
      status: 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        dynamodb: 'unhealthy',
      },
      error: process.env.NODE_ENV === 'production' 
        ? 'Health check failed' 
        : (error as Error).message,
    });
  }
});

export const healthRouter = router;
EOF
```

## Step 8: Configure Worker Package

```bash
# Create Worker Lambda handler
cat > packages/worker/src/main.ts << EOF
import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Logger, JobStatus } from '@cody-batch/shared';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const logger = new Logger('Worker');

// DynamoDB client
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Lambda client
const lambda = new LambdaClient({});

// Handler
export const handler = async (event: { jobId: string }): Promise<void> => {
  logger.info('Worker invoked', { event });
  
  try {
    const { jobId } = event;
    
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    
    // Get job from DynamoDB
    const jobResult = await dynamoDb.send(new GetCommand({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId },
    }));
    
    const job = jobResult.Item;
    
    if (!job) {
      throw new Error(\`Job not found: \${jobId}\`);
    }
    
    logger.info('Processing job', { job });
    
    // Update job status to in-progress
    await dynamoDb.send(new UpdateCommand({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, #startedAt = :startedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#startedAt': 'startedAt',
      },
      ExpressionAttributeValues: {
        ':status': 'in-progress' as JobStatus,
        ':startedAt': Date.now(),
      },
    }));
    
    // TODO: Implement job processing logic
    // 1. Process each repository
    // 2. Analyze code for vulnerabilities
    // 3. Generate fixes using Claude 3.7
    // 4. Create pull requests or store diffs
    // 5. Update repository status
    
    // For now, just update job status to completed
    await dynamoDb.send(new UpdateCommand({
      TableName: process.env.JOBS_TABLE,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, #completedAt = :completedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#completedAt': 'completedAt',
      },
      ExpressionAttributeValues: {
        ':status': 'completed' as JobStatus,
        ':completedAt': Date.now(),
      },
    }));
    
    logger.info('Job completed', { jobId });
  } catch (error) {
    logger.error('Job processing failed', error as Error);
    
    // If we have a job ID, update its status to failed
    if (event.jobId) {
      try {
        await dynamoDb.send(new UpdateCommand({
          TableName: process.env.JOBS_TABLE,
          Key: { jobId: event.jobId },
          UpdateExpression: 'SET #status = :status, #error = :error, #completedAt = :completedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#error': 'error',
            '#completedAt': 'completedAt',
          },
          ExpressionAttributeValues: {
            ':status': 'failed' as JobStatus,
            ':error': (error as Error).message,
            ':completedAt': Date.now(),
          },
        }));
      } catch (updateError) {
        logger.error('Failed to update job status', updateError as Error);
      }
    }
    
    throw error;
  }
};
EOF
```

## Step 9: Configure Frontend Package

```bash
# Create frontend app
cat > packages/frontend/src/app/app.tsx << EOF
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, RouterProvider, Route, RootRoute } from '@tanstack/react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create routes
const rootRoute = new RootRoute({
  component: Layout,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const jobsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs',
  component: JobsPage,
});

const jobDetailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId',
  component: JobDetailPage,
});

const createJobRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs/create',
  component: CreateJobPage,
});

const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
});

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  jobsRoute,
  jobDetailRoute,
  createJobRoute,
  notFoundRoute,
]);

const router = new Router({ routeTree });

// Register router types
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
EOF
```

## Step 10: Set Up Environment Variables

```bash
# Create .env file
cat > .env << EOF
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Claude API
CLAUDE_API_KEY=your_claude_api_key

# AWS
AWS_REGION=us-east-1
ALLOWED_REPOSITORIES=liamzdenek/*

# Development
NODE_ENV=development
EOF
```

## Step 11: Build and Deploy

```bash
# Build all packages
nx run-many --target=build --all

# Deploy infrastructure
nx run cdk:deploy
```

## Next Steps

After initializing the project, the next steps would be:

1. Implement the GitHub client package
2. Implement the Claude client package
3. Complete the API routes
4. Implement the worker job processing logic
5. Develop the frontend UI components
6. Test the end-to-end flow
7. Deploy to AWS

Each of these steps would involve detailed implementation work that builds upon the foundation established during initialization.