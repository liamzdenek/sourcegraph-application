import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ClaudeContext } from '../claude-context';

/**
 * Tool definition format for Claude API
 */
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

/**
 * Interface for all tools that Claude can use
 */
export interface Tool<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType
> {
  // Tool metadata
  name: string;
  description: string;
  
  // Schemas for input and output
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  
  // Method to execute the tool with context
  execute(input: z.infer<TInputSchema>, context: ClaudeContext): Promise<z.infer<TOutputSchema>>;
  
  // Convert to Claude API format
  toClaudeToolDefinition(): ClaudeToolDefinition;
}

/**
 * Base class for implementing tools
 */
export abstract class BaseTool<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType
> implements Tool<TInputSchema, TOutputSchema> {
  
  constructor(
    public name: string,
    public description: string,
    public inputSchema: TInputSchema,
    public outputSchema: TOutputSchema
  ) {}
  
  abstract execute(input: z.infer<TInputSchema>, context: ClaudeContext): Promise<z.infer<TOutputSchema>>;
  
  toClaudeToolDefinition(): ClaudeToolDefinition {
    // @ts-ignore - Suppress the "Type instantiation is excessively deep and possibly infinite" error
    return {
      name: this.name,
      description: this.description,
      input_schema: zodToJsonSchema(this.inputSchema)
    };
  }
}