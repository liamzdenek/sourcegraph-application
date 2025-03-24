import { ClaudeClient } from './claude-client';

/**
 * Context for Claude tool execution
 */
export interface ClaudeContext {
  /**
   * The Claude client instance
   */
  client: ClaudeClient;
  
  /**
   * Path to the repository
   */
  repositoryPath: string;
  
  /**
   * Session ID for tracking
   */
  sessionId: string;
  
  /**
   * Additional context data
   */
  [key: string]: any;
}