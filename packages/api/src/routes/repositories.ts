import express, { Request, Response } from 'express';
import { z } from 'zod';

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
    
    // This would normally fetch repositories from GitHub API
    // For now, we'll return mock data
    const repositories = getMockRepositories(filter);
    
    // Paginate results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedRepositories = repositories.slice(startIndex, endIndex);
    
    res.json({
      repositories: paginatedRepositories,
      pagination: {
        page,
        perPage,
        total: repositories.length,
        totalPages: Math.ceil(repositories.length / perPage)
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

/**
 * Get mock repositories for development
 */
function getMockRepositories(filter?: string): any[] {
  const repositories = [
    {
      id: 'repo1',
      name: 'liamzdenek/repo1',
      description: 'Repository description',
      url: 'https://github.com/liamzdenek/repo1'
    },
    {
      id: 'repo2',
      name: 'liamzdenek/repo2',
      description: 'Another repository',
      url: 'https://github.com/liamzdenek/repo2'
    },
    {
      id: 'repo3',
      name: 'liamzdenek/repo3',
      description: 'Third repository',
      url: 'https://github.com/liamzdenek/repo3'
    },
    {
      id: 'repo4',
      name: 'liamzdenek/repo4',
      description: 'Fourth repository',
      url: 'https://github.com/liamzdenek/repo4'
    },
    {
      id: 'repo5',
      name: 'liamzdenek/repo5',
      description: 'Fifth repository',
      url: 'https://github.com/liamzdenek/repo5'
    }
  ];
  
  if (filter) {
    return repositories.filter(repo => 
      repo.name.toLowerCase().includes(filter.toLowerCase()) || 
      repo.description.toLowerCase().includes(filter.toLowerCase())
    );
  }
  
  return repositories;
}

export default router;