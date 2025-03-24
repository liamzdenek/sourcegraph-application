import { Anthropic } from '@anthropic-ai/sdk';
import { ClaudeClientConfig } from 'shared';
import { ToolRegistry } from './tools/tool-registry';
import { ClaudeContext } from './claude-context';
import { 
  ListFilesTool, 
  ReadFileTool, 
  WriteFileTool, 
  SearchCodeTool,
  TaskCompleteTool
} from './tools/repository-tools';

// Define types for Anthropic API
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}

interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

type AnthropicContentBlock = AnthropicToolUseBlock | AnthropicTextBlock | AnthropicToolResultBlock;

interface AnthropicResponse {
  id: string;
  content: AnthropicContentBlock[];
  model: string;
  role: 'assistant';
  stop_reason: string | null;
  stop_sequence: string | null;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Client for interacting with the Claude API
 */
export class ClaudeClient {
  private client: Anthropic;
  private config: ClaudeClientConfig;
  private toolRegistry: ToolRegistry;
  private tokenUsage: Record<string, { 
    input: number, 
    output: number, 
    cacheCreation: number,
    cacheRead: number
  }> = {};

  /**
   * Create a new Claude client
   * @param config Client configuration
   */
  constructor(config: ClaudeClientConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.toolRegistry = new ToolRegistry();
    this.initializeTools();
  }

  /**
   * Initialize tools
   */
  private initializeTools(): void {
    // Register repository tools
    this.toolRegistry.registerTool(new ListFilesTool());
    this.toolRegistry.registerTool(new ReadFileTool());
    this.toolRegistry.registerTool(new WriteFileTool());
    this.toolRegistry.registerTool(new SearchCodeTool());
    this.toolRegistry.registerTool(new TaskCompleteTool());
  }

  /**
   * Run an autonomous code analysis and modification session
   * @param repositoryPath Path to the repository
   * @param prompt User prompt
   * @param maxIterations Maximum number of iterations
   * @returns Session results
   */
  async runAutonomousSession(
    repositoryPath: string, 
    prompt: string, 
    maxIterations: number = 10
  ) {
    // Create session ID
    const sessionId = `session_${Date.now()}`;
    
    // Create context object
    const context: ClaudeContext = {
      client: this,
      repositoryPath,
      sessionId
    };
    
    // Initialize token usage tracking
    this.tokenUsage[sessionId] = { 
      input: 0, 
      output: 0,
      cacheCreation: 0,
      cacheRead: 0
    };
    
    // Create system message with cacheable instructions
    const system = `You are an expert software engineer tasked with analyzing and modifying code in a repository. 
You have access to tools that allow you to explore the repository, read and write files, and search for patterns in the code.
Your goal is to complete the task as efficiently as possible, making only necessary changes.
When you're done, use the task_complete tool to indicate completion and provide a summary of your changes.`;
    
    // Start the conversation with just the user's prompt
    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];
    
    let iterations = 0;
    let complete = false;
    const conversationHistory: Array<{role: string, content: any}> = [...messages];
    
    while (!complete && iterations < maxIterations) {
      iterations++;
      console.log(`Iteration ${iterations}/${maxIterations}`);
      
      // Get Claude's response with prompt caching
      // Use type assertion to work around type issues
      const response = await this.client.beta.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 100000,
        temperature: this.config.temperature || 0.5,
        system,
        tools: this.toolRegistry.getClaudeToolDefinitions(),
        messages: messages as any,
        'anthropic-beta': 'messages-2023-12-15'
      } as any) as unknown as AnthropicResponse;
      
      // Update token usage
      this.tokenUsage[sessionId].input += response.usage.input_tokens;
      this.tokenUsage[sessionId].output += response.usage.output_tokens;
      
      // Track cache usage if available
      if ('cache_creation_input_tokens' in response.usage) {
        this.tokenUsage[sessionId].cacheCreation += response.usage.cache_creation_input_tokens || 0;
      }
      if ('cache_read_input_tokens' in response.usage) {
        this.tokenUsage[sessionId].cacheRead += response.usage.cache_read_input_tokens || 0;
      }
      
      // Add Claude's response to conversation history
      conversationHistory.push({
        role: 'assistant',
        content: response.content
      });
      
      // Check if Claude used a tool
      if (response.stop_reason === 'tool_use') {
        // Process each tool use request
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const toolUseBlock = block as AnthropicToolUseBlock;
            console.log(`Claude is using tool: ${toolUseBlock.name}`);
            
            try {
              // Execute the requested tool using the registry with context
              const toolResult = await this.toolRegistry.executeTool(
                toolUseBlock.name,
                toolUseBlock.input,
                context
              );
              
              // Add Claude's response to messages
              messages.push({
                role: 'assistant',
                content: response.content
              });
              
              // Add tool result to messages
              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify(toolResult)
                  }
                ]
              });
              
              // Add tool result to conversation history
              conversationHistory.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify(toolResult)
                  }
                ]
              });
              
              // Check if the task_complete tool was used
              if (toolUseBlock.name === 'task_complete') {
                complete = true;
              }
            } catch (error) {
              // Handle tool execution errors
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`Error executing tool ${toolUseBlock.name}:`, errorMessage);
              
              // Add Claude's response to messages
              messages.push({
                role: 'assistant',
                content: response.content
              });
              
              // Add error result to messages
              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    is_error: true,
                    content: `Error executing tool: ${errorMessage}`
                  }
                ]
              });
              
              // Add error result to conversation history
              conversationHistory.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    is_error: true,
                    content: `Error executing tool: ${errorMessage}`
                  }
                ]
              });
            }
          }
        }
      } else {
        // Claude has completed its response without using a tool
        messages.push({
          role: 'assistant',
          content: response.content
        });
        
        // Check if Claude indicates completion
        const responseText = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as AnthropicTextBlock).text)
          .join('\n');
          
        if (
          responseText.includes('I have completed the task') ||
          responseText.includes('All necessary changes have been made') ||
          responseText.includes('The task is complete')
        ) {
          complete = true;
        } else {
          // Ask Claude if it needs to do anything else
          messages.push({
            role: 'user',
            content: 'Do you need to make any other changes to complete the task? If not, please indicate that the task is complete or use the task_complete tool.'
          });
          
          conversationHistory.push({
            role: 'user',
            content: 'Do you need to make any other changes to complete the task? If not, please indicate that the task is complete or use the task_complete tool.'
          });
        }
      }
    }
    
    return {
      complete,
      iterations,
      conversationHistory,
      tokenUsage: this.tokenUsage[sessionId]
    };
  }
  
  /**
   * Get token usage statistics
   * @param sessionId Optional session ID to get usage for
   * @returns Token usage statistics
   */
  getTokenUsage(sessionId?: string): { 
    input: number, 
    output: number, 
    cacheCreation: number,
    cacheRead: number,
    total: number 
  } {
    if (sessionId && this.tokenUsage[sessionId]) {
      const { input, output, cacheCreation, cacheRead } = this.tokenUsage[sessionId];
      return { 
        input, 
        output, 
        cacheCreation,
        cacheRead,
        total: input + output 
      };
    }
    
    // Aggregate all sessions
    const total = Object.values(this.tokenUsage).reduce(
      (acc: { 
        input: number, 
        output: number, 
        cacheCreation: number,
        cacheRead: number,
        total: number 
      }, { input, output, cacheCreation, cacheRead }) => ({
        input: acc.input + input,
        output: acc.output + output,
        cacheCreation: acc.cacheCreation + cacheCreation,
        cacheRead: acc.cacheRead + cacheRead,
        total: acc.total + input + output
      }),
      { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 }
    );
    
    return total;
  }
}
