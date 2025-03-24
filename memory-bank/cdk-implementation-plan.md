# CDK Implementation Plan for Cody Batch

## Overview

This document outlines the plan for implementing the AWS CDK infrastructure for the Cody Batch project. We'll use a single stack approach for simplicity, while ensuring all necessary resources are properly configured and connected.

## Goals

1. Create a single CDK stack that includes all required AWS resources
2. Configure environment variables for all components
3. Set up proper IAM roles and permissions
4. Implement frontend deployment with environment variable injection
5. Create NX targets for building and deploying the infrastructure
6. Use the AWS profile "lz-demos" for deployment

## AWS Resources

### DynamoDB Tables

1. **Jobs Table**
   - Partition Key: `jobId` (string)
   - GSI: `status-createdAt-index` for querying jobs by status
   - TTL: `expiresAt` for automatic cleanup after 30 days

2. **Repositories Table**
   - Partition Key: `jobId` (string)
   - Sort Key: `repositoryName` (string)
   - GSI: `status-index` for querying repositories by status
   - TTL: `expiresAt` for automatic cleanup after 30 days

### Lambda Functions

1. **API Lambda**
   - Runtime: Node.js 18.x
   - Handler: `dist/packages/api/main.handler`
   - Memory: 1024 MB
   - Timeout: 30 seconds
   - Environment Variables:
     - `DYNAMODB_JOBS_TABLE`: Jobs table name
     - `DYNAMODB_REPOSITORIES_TABLE`: Repositories table name
     - `GITHUB_TOKEN`: GitHub service account token (from parameter)
     - `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repository patterns
     - `AWS_BATCH_JOB_QUEUE`: Batch job queue ARN
     - `AWS_BATCH_JOB_DEFINITION`: Batch job definition ARN
     - `AWS_REGION`: AWS region

### API Gateway

1. **REST API**
   - Routes:
     - `GET /health`: Health check endpoint
     - `GET /repositories`: List repositories
     - `GET /jobs`: List jobs
     - `POST /jobs`: Create job
     - `GET /jobs/{jobId}`: Get job details
     - `POST /jobs/{jobId}/cancel`: Cancel job
     - `GET /jobs/{jobId}/repositories/{repositoryName}`: Get repository details
     - `GET /jobs/{jobId}/repositories/{repositoryName}/diff`: Get repository diff
     - `GET /jobs/{jobId}/repositories/{repositoryName}/claude-thread`: Get Claude thread
   - CORS: Enabled for frontend domain
   - Authorization: None (using service account)

### AWS Batch

1. **Compute Environment**
   - Type: MANAGED
   - Instance Types: `optimal`
   - Min vCPUs: 0
   - Max vCPUs: 16
   - Spot: false (use On-Demand for reliability)

2. **Job Queue**
   - Priority: 1
   - Compute Environment: Link to the compute environment

3. **Job Definition**
   - Type: container
   - Image: ECR repository URI with batch processor image
   - vCPUs: 2
   - Memory: 4 GB
   - Command: `node dist/packages/batch/main.js`
   - Environment Variables:
     - `DYNAMODB_JOBS_TABLE`: Jobs table name
     - `DYNAMODB_REPOSITORIES_TABLE`: Repositories table name
     - `GITHUB_TOKEN`: GitHub service account token (from parameter)
     - `CLAUDE_API_KEY`: Claude API key (from parameter)
     - `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repository patterns
     - `AWS_REGION`: AWS region

### S3 Bucket

1. **Frontend Bucket**
   - Public Access: Blocked
   - Versioning: Enabled
   - Website Hosting: Enabled
   - Lifecycle Rules: None (manual cleanup)

### CloudFront Distribution

1. **Frontend Distribution**
   - Origin: S3 bucket
   - Behaviors: Default (/*) with no cache
   - Price Class: PriceClass_100 (US, Canada, Europe)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed Methods: GET, HEAD, OPTIONS
   - Cache Policy: CachingDisabled
   - Origin Access Identity: Create new OAI

### IAM Roles and Policies

1. **Lambda Execution Role**
   - Permissions:
     - DynamoDB: Read/Write to both tables
     - Batch: Submit jobs
     - CloudWatch: Write logs
     - SSM: Read parameters

2. **Batch Execution Role**
   - Permissions:
     - DynamoDB: Read/Write to both tables
     - S3: Read/Write to frontend bucket
     - CloudWatch: Write logs
     - SSM: Read parameters
     - ECR: Pull images

## Environment Variables

### API Package

```
DYNAMODB_JOBS_TABLE=<jobs-table-name>
DYNAMODB_REPOSITORIES_TABLE=<repositories-table-name>
GITHUB_TOKEN=<github-token>
ALLOWED_REPOSITORIES=github.com/liamzdenek/*
AWS_BATCH_JOB_QUEUE=<job-queue-arn>
AWS_BATCH_JOB_DEFINITION=<job-definition-arn>
AWS_REGION=<aws-region>
```

### Batch Package

```
DYNAMODB_JOBS_TABLE=<jobs-table-name>
DYNAMODB_REPOSITORIES_TABLE=<repositories-table-name>
GITHUB_TOKEN=<github-token>
CLAUDE_API_KEY=<claude-api-key>
ALLOWED_REPOSITORIES=github.com/liamzdenek/*
AWS_REGION=<aws-region>
```

### Frontend Package

```
VITE_API_BASE_URL=<api-gateway-url>
```

## Implementation Steps

1. **Initialize CDK Stack**
   - Create a single stack for all resources
   - Configure AWS profile "lz-demos"
   - Set up environment variables

2. **Define DynamoDB Tables**
   - Create Jobs table with GSI
   - Create Repositories table with GSI
   - Configure TTL for both tables

3. **Set Up Batch Resources**
   - Create compute environment
   - Create job queue
   - Create job definition with environment variables

4. **Create Lambda Function**
   - Define Lambda function with environment variables
   - Create execution role with necessary permissions
   - Configure timeout and memory

5. **Set Up API Gateway**
   - Create REST API
   - Configure routes
   - Enable CORS
   - Connect to Lambda function

6. **Configure Frontend Hosting**
   - Create S3 bucket
   - Set up CloudFront distribution
   - Configure Origin Access Identity
   - Set up BucketDeployment with environment variable injection

7. **Create NX Targets**
   - Add build target for CDK
   - Add deploy target for CDK
   - Configure dependencies between targets

## NX Targets

### Build Targets

1. **build-api**
   - Command: `nx build api`
   - Output: `dist/packages/api`

2. **build-batch**
   - Command: `nx build batch`
   - Output: `dist/packages/batch`

3. **build-frontend**
   - Command: `nx build frontend`
   - Output: `dist/packages/frontend`
   - Environment Variables: `VITE_API_BASE_URL`

4. **build-cdk**
   - Command: `nx build cdk`
   - Output: `dist/packages/cdk`
   - Dependencies: `build-api`, `build-batch`, `build-frontend`

### Deploy Targets

1. **deploy-cdk**
   - Command: `nx run cdk:deploy`
   - Description: Deploy all infrastructure
   - Dependencies: `build-cdk`
   - AWS Profile: `lz-demos`

2. **deploy**
   - Command: `nx run deploy-cdk`
   - Description: Alias for deploy-cdk

## CDK Implementation

### Main Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class CodyBatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parameters
    const githubToken = new cdk.CfnParameter(this, 'GitHubToken', {
      type: 'String',
      description: 'GitHub service account token',
      noEcho: true,
    });

    const claudeApiKey = new cdk.CfnParameter(this, 'ClaudeApiKey', {
      type: 'String',
      description: 'Claude API key',
      noEcho: true,
    });

    const allowedRepositories = new cdk.CfnParameter(this, 'AllowedRepositories', {
      type: 'String',
      description: 'Comma-separated list of allowed repository patterns',
      default: 'github.com/liamzdenek/*',
    });

    // DynamoDB Tables
    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    jobsTable.addGlobalSecondaryIndex({
      indexName: 'status-createdAt-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const repositoriesTable = new dynamodb.Table(this, 'RepositoriesTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'repositoryName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    repositoriesTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Batch Resources
    const vpc = new ec2.Vpc(this, 'BatchVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const batchExecutionRole = new iam.Role(this, 'BatchExecutionRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Add permissions to the batch execution role
    jobsTable.grantReadWriteData(batchExecutionRole);
    repositoriesTable.grantReadWriteData(batchExecutionRole);

    const computeEnvironment = new batch.CfnComputeEnvironment(this, 'ComputeEnvironment', {
      type: 'MANAGED',
      computeResources: {
        type: 'EC2',
        maxvCpus: 16,
        minvCpus: 0,
        desiredvCpus: 0,
        instanceTypes: ['optimal'],
        subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [vpc.vpcDefaultSecurityGroup],
      },
      serviceRole: batchExecutionRole.roleArn,
    });

    const jobQueue = new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: computeEnvironment.ref,
        },
      ],
    });

    const jobDefinition = new batch.CfnJobDefinition(this, 'JobDefinition', {
      type: 'container',
      containerProperties: {
        image: 'amazon/aws-cli',  // Placeholder, will be replaced with actual image
        vcpus: 2,
        memory: 4096,
        command: ['node', 'dist/packages/batch/main.js'],
        environment: [
          { name: 'DYNAMODB_JOBS_TABLE', value: jobsTable.tableName },
          { name: 'DYNAMODB_REPOSITORIES_TABLE', value: repositoriesTable.tableName },
          { name: 'GITHUB_TOKEN', value: githubToken.valueAsString },
          { name: 'CLAUDE_API_KEY', value: claudeApiKey.valueAsString },
          { name: 'ALLOWED_REPOSITORIES', value: allowedRepositories.valueAsString },
          { name: 'AWS_REGION', value: this.region },
        ],
      },
    });

    // Lambda Function
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../dist/packages/api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        DYNAMODB_JOBS_TABLE: jobsTable.tableName,
        DYNAMODB_REPOSITORIES_TABLE: repositoriesTable.tableName,
        GITHUB_TOKEN: githubToken.valueAsString,
        ALLOWED_REPOSITORIES: allowedRepositories.valueAsString,
        AWS_BATCH_JOB_QUEUE: jobQueue.ref,
        AWS_BATCH_JOB_DEFINITION: jobDefinition.ref,
        AWS_REGION: this.region,
      },
    });

    // Grant permissions to the Lambda function
    jobsTable.grantReadWriteData(apiLambda);
    repositoriesTable.grantReadWriteData(apiLambda);
    apiLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['batch:SubmitJob', 'batch:CancelJob', 'batch:DescribeJobs'],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'CodyBatchApi', {
      restApiName: 'Cody Batch API',
      description: 'API for Cody Batch',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda);
    api.root.addMethod('ANY', lambdaIntegration);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Frontend Hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    frontendBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Deploy frontend with environment variables
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../../dist/packages/frontend'), {
          exclude: ['index.html'],
        }),
        s3deploy.Source.asset(path.join(__dirname, '../../../dist/packages/frontend'), {
          exclude: ['**', '!index.html'],
          bundling: {
            image: cdk.DockerImage.fromRegistry('amazon/aws-cli'),
            command: [
              'bash', '-c', `
              sed -i 's|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${api.url}|g' /asset-input/index.html &&
              cp /asset-input/index.html /asset-output/
              `,
            ],
          },
        }),
      ],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'JobsTableName', {
      value: jobsTable.tableName,
      description: 'Jobs Table Name',
    });

    new cdk.CfnOutput(this, 'RepositoriesTableName', {
      value: repositoriesTable.tableName,
      description: 'Repositories Table Name',
    });

    new cdk.CfnOutput(this, 'JobQueueArn', {
      value: jobQueue.ref,
      description: 'Job Queue ARN',
    });

    new cdk.CfnOutput(this, 'JobDefinitionArn', {
      value: jobDefinition.ref,
      description: 'Job Definition ARN',
    });
  }
}
```

### CDK App

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CodyBatchStack } from './cdk-stack';

const app = new cdk.App();
new CodyBatchStack(app, 'CodyBatchStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

### Project Configuration

Update `project.json` for the CDK package:

```json
{
  "name": "cdk",
  "sourceRoot": "packages/cdk/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "platform": "node",
        "outputPath": "dist/packages/cdk",
        "format": ["cjs"],
        "bundle": true,
        "main": "packages/cdk/src/main.ts",
        "tsConfig": "packages/cdk/tsconfig.app.json",
        "assets": ["packages/cdk/src/assets"],
        "generatePackageJson": true,
        "esbuildOptions": {
          "sourcemap": true,
          "outExtension": {
            ".js": ".js"
          }
        }
      },
      "configurations": {
        "development": {},
        "production": {
          "esbuildOptions": {
            "sourcemap": false,
            "outExtension": {
              ".js": ".js"
            }
          }
        }
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "dist/packages/cdk",
        "command": "cdk deploy --profile lz-demos --require-approval never"
      },
      "dependsOn": [
        {
          "target": "build",
          "projects": "self"
        },
        {
          "target": "build",
          "projects": "dependencies"
        }
      ]
    }
  },
  "tags": []
}
```

Update root `project.json` to add a deploy target:

```json
{
  "targets": {
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run cdk:deploy"
      }
    }
  }
}
```

## Dependencies

Add the following dependencies to the CDK package:

```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.80.0",
    "constructs": "^10.2.69"
  },
  "devDependencies": {
    "aws-cdk": "^2.80.0"
  }
}
```

## Conclusion

This plan outlines a comprehensive approach to implementing the CDK infrastructure for the Cody Batch project. By using a single stack, we can simplify deployment while ensuring all resources are properly configured and connected. The NX targets provide a streamlined way to build and deploy the infrastructure, with the final `nx deploy` command handling everything.

The implementation includes all necessary AWS resources, proper IAM roles and permissions, and environment variable injection for the frontend. By using the AWS profile "lz-demos", we ensure consistent deployment across environments.