import { Tool, ClaudeToolDefinition } from './tool-interface';
import { ClaudeContext } from '../claude-context';

/**
 * Registry for Claude tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool<any, any>> = new Map();

  /**
   * Register a tool
   * @param tool Tool to register
   */
  registerTool(tool: Tool<any, any>): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get all registered tools
   * @returns Array of registered tools
   */
  getTools(): Tool<any, any>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a tool by name
   * @param name Tool name
   * @returns Tool or undefined if not found
   */
  getTool(name: string): Tool<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Get Claude tool definitions for all registered tools
   * @returns Array of Claude tool definitions
   */
  getClaudeToolDefinitions(): ClaudeToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.toClaudeToolDefinition());
  }

  /**
   * Execute a tool
   * @param name Tool name
   * @param input Tool input
   * @param context Execution context
   * @returns Tool execution result
   * @throws Error if tool not found
   */
  async executeTool(name: string, input: any, context: ClaudeContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    console.log(`\n=== TOOL EXECUTION: ${name} ===`);
    console.log(`Repository Path: ${context.repositoryPath}`);
    console.log(`Input: ${JSON.stringify(input, null, 2)}`);
    
    try {
      const result = await tool.execute(input, context);
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
      console.log(`=== END TOOL EXECUTION: ${name} ===\n`);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      console.log(`=== END TOOL EXECUTION (ERROR): ${name} ===\n`);
      throw error;
    }
  }
}