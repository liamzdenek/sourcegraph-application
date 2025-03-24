import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { BatchClient } from '@aws-sdk/client-batch';

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT // For local development
});

export const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const batchClient = new BatchClient({
  region: process.env.AWS_REGION || 'us-east-1'
});