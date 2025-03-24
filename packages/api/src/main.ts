import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

// Import AWS clients
import { dynamoDbDocClient, batchClient } from './lib/aws-clients';

// Import routes
import healthRoutes from './routes/health';
import repositoryRoutes from './routes/repositories';
import jobRoutes from './routes/jobs';

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
    'GITHUB_TOKEN'
  ];
  
  // Optional vars that we'll warn about but not fail
  const optionalVars = [
    'CLAUDE_API_KEY'
  ];
  
  const missingRequiredVars = requiredVars.filter(varName => !process.env[varName]);
  const missingOptionalVars = optionalVars.filter(varName => !process.env[varName]);
  
  if (missingOptionalVars.length > 0) {
    console.warn(`Warning: Missing optional environment variables: ${missingOptionalVars.join(', ')}`);
  }
  
  if (missingRequiredVars.length > 0) {
    console.warn(`Warning: Missing required environment variables: ${missingRequiredVars.join(', ')}`);
    
    // In production, we want to fail if required environment variables are missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingRequiredVars.join(', ')}`);
    }
  }
}

// Validate environment variables
validateEnvironment();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/health', healthRoutes);
app.use('/repositories', repositoryRoutes);
app.use('/jobs', jobRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
export const handler = serverless(app);
