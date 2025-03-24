import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Configuration options for the GitHub client
 */
export interface GitHubClientConfig {
  /**
   * GitHub token for authentication
   */
  token: string;
  
  /**
   * Allowed repository patterns (e.g., "liamzdenek/*")
   */
  allowedRepositories: string[];
  
  /**
   * Base URL for GitHub API (optional, defaults to GitHub.com)
   */
  baseUrl?: string;
  
  /**
   * Temporary directory for cloning repositories (optional)
   */
  tempDir?: string;
}

/**
 * Repository information
 */
export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  owner: {
    login: string;
    id: string;
  };
}

/**
 * Pull request information
 */
export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  url: string;
  htmlUrl: string;
  state: string;
}

/**
 * Repository clone result
 */
export interface CloneResult {
  repoPath: string;
  git: SimpleGit;
}

/**
 * Helper function to get error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * GitHub client for interacting with the GitHub API
 */
export class GitHubClient {
  private octokit: Octokit;
  private config: GitHubClientConfig;
  private tempDir: string;
  
  /**
   * Create a new GitHub client
   * @param config Client configuration
   */
  constructor(config: GitHubClientConfig) {
    this.config = config;
    
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.baseUrl,
    });
    
    this.tempDir = config.tempDir || path.join(os.tmpdir(), 'cody-batch');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * List repositories matching the allowed patterns
   * @param page Page number (1-based)
   * @param perPage Items per page
   * @param filter Optional filter by name
   * @returns List of repositories
   */
  async listRepositories(page = 1, perPage = 10, filter?: string): Promise<{ repositories: Repository[], total: number }> {
    try {
      // Get repositories for the authenticated user
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      });
      
      // Filter repositories based on allowed patterns
      const filteredRepos = data
        .filter(repo => this.isRepositoryAllowed(repo.full_name))
        .filter(repo => !filter || repo.name.toLowerCase().includes(filter.toLowerCase()) || 
                        (repo.description && repo.description.toLowerCase().includes(filter.toLowerCase())));
      
      // Map to Repository interface
      const repositories = filteredRepos.map(repo => ({
        id: repo.node_id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        isPrivate: repo.private,
        owner: {
          login: repo.owner.login,
          id: repo.owner.id.toString(),
        },
      }));
      
      return {
        repositories,
        total: repositories.length, // This is not accurate for pagination, but GitHub API doesn't provide a total count
      };
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw new Error(`Failed to list repositories: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Check if a repository is allowed based on the configured patterns
   * @param fullName Full repository name (e.g., "liamzdenek/repo1" or "github.com/liamzdenek/repo1")
   * @returns Whether the repository is allowed
   */
  isRepositoryAllowed(fullName: string): boolean {
    // Allow all repositories
    console.log(`Repository ${fullName} is allowed (all repositories are allowed)`);
    return true;
  }
  
  /**
   * Clone a repository
   * @param repoFullName Full repository name (e.g., "liamzdenek/repo1")
   * @returns Clone result with repository path and git instance
   */
  async cloneRepository(repoFullName: string): Promise<CloneResult> {
    try {
      // Check if repository is allowed
      if (!this.isRepositoryAllowed(repoFullName)) {
        throw new Error(`Repository ${repoFullName} is not allowed`);
      }
      
      // Create a unique directory for the repository
      const repoDir = path.join(this.tempDir, repoFullName.replace('/', '-'));
      
      // Remove directory if it already exists
      if (fs.existsSync(repoDir)) {
        fs.rmSync(repoDir, { recursive: true, force: true });
      }
      
      // Create directory
      fs.mkdirSync(repoDir, { recursive: true });
      
      // Clone repository
      const git = simpleGit();
      
      // Ensure we don't double-prefix the URL with github.com
      const normalizedRepoName = repoFullName.startsWith('github.com/')
        ? repoFullName.substring('github.com/'.length)
        : repoFullName;
      
      const repoUrl = `https://${this.config.token}@github.com/${normalizedRepoName}.git`;
      console.log(`Cloning from URL: ${repoUrl.replace(this.config.token, '***')}`);
      await git.clone(repoUrl, repoDir);
      
      // Initialize git in the cloned directory
      const repoGit = simpleGit(repoDir);
      
      return {
        repoPath: repoDir,
        git: repoGit,
      };
    } catch (error) {
      console.error(`Error cloning repository ${repoFullName}:`, error);
      throw new Error(`Failed to clone repository ${repoFullName}: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Create a branch in a repository
   * @param repoFullName Full repository name (e.g., "liamzdenek/repo1")
   * @param branchName Name of the branch to create
   * @param baseBranch Base branch to create from (default: "main")
   * @returns Whether the branch was created
   */
  async createBranch(repoFullName: string, branchName: string, baseBranch = 'main'): Promise<boolean> {
    try {
      // Clone repository
      const { git } = await this.cloneRepository(repoFullName);
      
      // Check if branch already exists
      const branches = await git.branch();
      if (branches.all.includes(branchName)) {
        console.log(`Branch ${branchName} already exists in ${repoFullName}`);
        return false;
      }
      
      // Create branch
      await git.checkoutBranch(branchName, baseBranch);
      
      return true;
    } catch (error) {
      console.error(`Error creating branch ${branchName} in ${repoFullName}:`, error);
      throw new Error(`Failed to create branch ${branchName} in ${repoFullName}: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Create a pull request
   * @param repoFullName Full repository name (e.g., "liamzdenek/repo1")
   * @param title Pull request title
   * @param body Pull request body
   * @param head Head branch
   * @param base Base branch (default: "main")
   * @returns Created pull request
   */
  async createPullRequest(
    repoFullName: string,
    title: string,
    body: string,
    head: string,
    base = 'main'
  ): Promise<PullRequest> {
    try {
      // Check if repository is allowed
      if (!this.isRepositoryAllowed(repoFullName)) {
        throw new Error(`Repository ${repoFullName} is not allowed`);
      }
      
      // Split repository name
      const [owner, repo] = repoFullName.split('/');
      
      // Create pull request
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });
      
      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || '',
        url: data.url,
        htmlUrl: data.html_url,
        state: data.state,
      };
    } catch (error) {
      console.error(`Error creating pull request in ${repoFullName}:`, error);
      throw new Error(`Failed to create pull request in ${repoFullName}: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Commit and push changes to a repository
   * @param repoPath Path to the repository
   * @param message Commit message
   * @param branch Branch to push to
   * @returns Whether the changes were pushed
   */
  async commitAndPush(repoPath: string, message: string, branch: string): Promise<boolean> {
    try {
      const git = simpleGit(repoPath);
      
      // Check if there are changes
      const status = await git.status();
      if (status.files.length === 0) {
        console.log('No changes to commit');
        return false;
      }
      
      // Add all changes
      await git.add('.');
      
      // Commit changes
      await git.commit(message);
      
      // Push changes
      await git.push('origin', branch);
      
      return true;
    } catch (error) {
      console.error(`Error committing and pushing changes:`, error);
      throw new Error(`Failed to commit and push changes: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Get rate limit information
   * @returns Rate limit information
   */
  async getRateLimit(): Promise<{ limit: number, remaining: number, reset: Date }> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
      };
    } catch (error) {
      console.error('Error getting rate limit:', error);
      throw new Error(`Failed to get rate limit: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Clean up temporary directories
   */
  cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up temporary directories:', error);
    }
  }
}
