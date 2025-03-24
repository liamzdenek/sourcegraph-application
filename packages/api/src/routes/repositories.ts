import express, { Request, Response } from 'express';
import { z } from 'zod';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbDocClient } from '../lib/aws-clients';

const router = express.Router();

// Validation schema for query parameters
const listRepositoriesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
  filter: z.string().optional()
});

/**
 * @route GET /repositories
 * @desc List available repositories
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { page, perPage, filter } = listRepositoriesSchema.parse(req.query);
    
    // Query DynamoDB for repositories
    const params = {
      TableName: process.env.DYNAMODB_REPOSITORIES_TABLE,
      KeyConditionExpression: 'jobId = :jobId',
      ExpressionAttributeValues: {
        ':jobId': 'available-repositories'
      }
    };

    const result = await dynamoDbDocClient.send(new QueryCommand(params));
    
    // Format repositories for response
    let repositories = result.Items || [];
    
    // Filter repositories if filter parameter is provided
    if (filter) {
      repositories = repositories.filter(repo => 
        repo.repositoryName.toLowerCase().includes(filter.toLowerCase()) || 
        (repo.description && repo.description.toLowerCase().includes(filter.toLowerCase()))
      );
    }
    
    // Format repositories for response
    const formattedRepositories = repositories.map(repo => ({
      id: repo.id,
      name: repo.repositoryName,
      description: repo.description || '',
      url: repo.url
    }));
    
    // Paginate results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedRepositories = formattedRepositories.slice(startIndex, endIndex);
    
    res.json({
      repositories: paginatedRepositories,
      pagination: {
        page,
        perPage,
        total: formattedRepositories.length,
        totalPages: Math.ceil(formattedRepositories.length / perPage)
      }
    });
  } catch (error) {
    console.error('Error listing repositories:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid query parameters',
          details: error.errors
        }
      });
    }
    
    res.status(500).json({
      error: {
        message: 'Failed to list repositories',
        details: error.message
      }
    });
  }
});

export default router;