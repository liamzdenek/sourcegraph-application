import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { BatchClient } from '@aws-sdk/client-batch';

// Import routes with .js extension (compiled output will be JavaScript)
import healthRoutes from './routes/health.js';
import repositoryRoutes from './routes/repositories.js';
import jobRoutes from './routes/jobs.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
function validateEnvironment() {
  const requiredVars = [
    'AWS_REGION',
    'DYNAMODB_JOBS_TABLE',
    'DYNAMODB_REPOSITORIES_TABLE',
    'AWS_BATCH_JOB_QUEUE',
    'AWS_BATCH_JOB_DEFINITION',
    'GITHUB_TOKEN',
    'CLAUDE_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    
    // In production, we want to fail if environment variables are missing
    if (process.env.NODE_ENV === 'production' && missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}

// Validate environment variables
validateEnvironment();

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT // For local development
});

const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

const batchClient = new BatchClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Add AWS clients to request object
app.use((req: Request, res: Response, next: NextFunction) => {
  req.dynamoDb = dynamoDbDocClient;
  req.batchClient = batchClient;
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/repositories', repositoryRoutes);
app.use('/jobs', jobRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_SERVER_ERROR',
    },
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`DynamoDB Jobs Table: ${process.env.DYNAMODB_JOBS_TABLE || 'cody-batch-dev-jobs'}`);
    console.log(`DynamoDB Repositories Table: ${process.env.DYNAMODB_REPOSITORIES_TABLE || 'cody-batch-dev-repositories'}`);
    console.log(`AWS Batch Job Queue: ${process.env.AWS_BATCH_JOB_QUEUE || 'not set'}`);
    console.log(`AWS Batch Job Definition: ${process.env.AWS_BATCH_JOB_DEFINITION || 'not set'}`);
  });
}

// For AWS Lambda
export const handler = async (event: any, context: any) => {
  // Create a promise that will resolve with the response
  return new Promise((resolve, reject) => {
    // Create mock request and response objects
    const req: any = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {},
      params: event.pathParameters || {},
      dynamoDb: dynamoDbDocClient,
      batchClient: batchClient
    };

    const res: any = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '',
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.body = JSON.stringify(data);
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
      send: function(data: any) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
      setHeader: function(name: string, value: string) {
        this.headers[name] = value;
        return this;
      }
    };

    // Process the request through Express
    app(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Not Found' }),
        });
      }
    });
  });
};

// Add type definitions for Express request
declare global {
  namespace Express {
    interface Request {
      dynamoDb: DynamoDBDocumentClient;
      batchClient: BatchClient;
    }
  }
}
