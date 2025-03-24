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

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const batchClient = new BatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
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
