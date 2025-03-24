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
import * as fs from 'fs';
import * as child_process from 'child_process';

// Helper function to find the git root
const findGitRoot = (startPath: string): string => {
  let currentPath = startPath;
  while (currentPath !== '/') {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  throw new Error('Could not find .git directory');
};

export class CodyBatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment variables
    const githubToken = process.env.GITHUB_TOKEN || '';
    const claudeApiKey = process.env.CLAUDE_API_KEY || '';
    const allowedRepositories = process.env.ALLOWED_REPOSITORIES || 'github.com/liamzdenek/*';

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }

    // Find the git root directory
    const gitRootDir = findGitRoot(__dirname);
    console.log(`Git root directory: ${gitRootDir}`);

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

    // Create IAM role for AWS Batch execution
    const batchExecutionRole = new iam.Role(this, 'BatchExecutionRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
    });

    // Create IAM role for task execution
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add permissions to the roles
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole')
    );
    taskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

    // Grant permissions to the task execution role
    jobsTable.grantReadWriteData(taskExecutionRole);
    repositoriesTable.grantReadWriteData(taskExecutionRole);

    // Create VPC for AWS Batch
    const batchVpc = new ec2.Vpc(this, 'BatchVpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });
    
    // Create security group for AWS Batch tasks
    const batchSecurityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: batchVpc,
      description: 'Security group for AWS Batch tasks',
      allowAllOutbound: true, // Allow outbound traffic to the internet
    });
    
    // Create AWS Batch compute environment
    const computeEnvironment = new batch.FargateComputeEnvironment(this, 'ComputeEnvironment', {
      maxvCpus: 4,
      spot: false,
      vpc: batchVpc,
      securityGroups: [batchSecurityGroup],
      serviceRole: batchExecutionRole
    });

    // Create AWS Batch job queue
    const jobQueue = new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: computeEnvironment.computeEnvironmentArn,
        },
      ],
    });

    // Create AWS Batch job definition
    const jobDefinition = new batch.CfnJobDefinition(this, 'JobDefinition', {
      type: 'container',
      containerProperties: {
        image: 'amazon/aws-cli',  // Placeholder, will be replaced with actual image
        fargatePlatformConfiguration: {
          platformVersion: 'LATEST',
        },
        resourceRequirements: [
          { type: 'VCPU', value: '1' },
          { type: 'MEMORY', value: '2048' },
        ],
        executionRoleArn: taskExecutionRole.roleArn,
        jobRoleArn: taskExecutionRole.roleArn,
        command: ['node', 'dist/packages/batch/main.js'],
        environment: [
          { name: 'DYNAMODB_JOBS_TABLE', value: jobsTable.tableName },
          { name: 'DYNAMODB_REPOSITORIES_TABLE', value: repositoriesTable.tableName },
          { name: 'GITHUB_TOKEN', value: githubToken },
          { name: 'CLAUDE_API_KEY', value: claudeApiKey },
          { name: 'ALLOWED_REPOSITORIES', value: allowedRepositories },
        ],
        networkConfiguration: {
          assignPublicIp: 'ENABLED'
        },
      },
      platformCapabilities: ['FARGATE'],
    });

    // Lambda Function
    const apiPath = path.join(gitRootDir, 'dist', 'packages', 'api');
    console.log(`API path: ${apiPath}`);
    console.log(`API path exists: ${fs.existsSync(apiPath)}`);

    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event, context) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Hello from Cody Batch API',
              tables: {
                jobs: process.env.DYNAMODB_JOBS_TABLE,
                repositories: process.env.DYNAMODB_REPOSITORIES_TABLE
              },
              event: event
            })
          };
        }
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        DYNAMODB_JOBS_TABLE: jobsTable.tableName,
        DYNAMODB_REPOSITORIES_TABLE: repositoriesTable.tableName,
        GITHUB_TOKEN: githubToken,
        ALLOWED_REPOSITORIES: allowedRepositories,
        AWS_BATCH_JOB_QUEUE: jobQueue.ref,
        AWS_BATCH_JOB_DEFINITION: jobDefinition.ref,
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
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebOriginAccessIdentity');
    frontendBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Check if the frontend build exists
    const frontendPath = path.join(gitRootDir, 'dist', 'packages', 'frontend');
    const frontendExists = fs.existsSync(frontendPath);
    console.log(`Frontend path: ${frontendPath}`);
    console.log(`Frontend path exists: ${frontendExists}`);

    // Throw an error if the frontend build doesn't exist
    if (!frontendExists) {
      throw new Error(`Frontend build not found at ${frontendPath}. Please run 'npx nx build frontend' first.`);
    }

    // Deploy the frontend
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(frontendPath)],
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