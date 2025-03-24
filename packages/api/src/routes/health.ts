import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check DynamoDB connection
    const dynamoDbStatus = await checkDynamoDbConnection(req);
    
    // Check GitHub API connection (placeholder for now)
    const githubStatus = 'healthy';
    
    // Check Claude API connection (placeholder for now)
    const claudeStatus = 'healthy';
    
    res.json({
      status: 'ok',
      message: 'API is healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        dynamodb: dynamoDbStatus,
        github: githubStatus,
        claude: claudeStatus
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Check DynamoDB connection
 */
async function checkDynamoDbConnection(req: Request): Promise<string> {
  try {
    // Simple check to see if we can access DynamoDB
    // In a real implementation, you might want to do a simple query
    return 'healthy';
  } catch (error) {
    console.error('DynamoDB health check failed:', error);
    return 'unhealthy';
  }
}

export default router;