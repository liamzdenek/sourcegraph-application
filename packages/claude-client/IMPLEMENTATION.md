# Claude Client Implementation Notes

This document provides detailed implementation notes for the Claude client.

## Core Components

### ClaudeClient

The `ClaudeClient` class is the main entry point for interacting with the Claude API. It manages the conversation with Claude and handles tool execution.

```typescript
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

  constructor(config: ClaudeClientConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.toolRegistry = new ToolRegistry();
    this.initializeTools();
  }

  // ...
}
```

Key methods:
- `initializeTools()`: Initializes the tools that Claude can use.
- `runAutonomousSession()`: Runs an autonomous session with Claude.
- `getTokenUsage()`: Gets token usage statistics.

### ToolRegistry

The `ToolRegistry` class manages the tools that Claude can use. It provides methods for registering tools and executing them.

```typescript
export class ToolRegistry {
  private tools: Map<string, Tool<any, any>> = new Map();

  registerTool(tool: Tool<any, any>): void {
    this.tools.set(tool.name, tool);
  }

  getClaudeToolDefinitions(): ClaudeToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.toClaudeToolDefinition());
  }

  async executeTool(name: string, input: any, context: ClaudeContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(input, context);
  }
}
```

### Tool Interface

The `Tool` interface defines the contract for tools that Claude can use.

```typescript
export interface Tool<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType
> {
  name: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  execute(input: z.infer<TInputSchema>, context: ClaudeContext): Promise<z.infer<TOutputSchema>>;
  toClaudeToolDefinition(): ClaudeToolDefinition;
}
```

### BaseTool

The `BaseTool` class provides a base implementation for tools.

```typescript
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
    return {
      name: this.name,
      description: this.description,
      input_schema: zodToJsonSchema(this.inputSchema)
    };
  }
}
```

### Repository Tools

The repository tools provide functionality for interacting with a repository.

- `ListFilesTool`: Lists files in a directory.
- `ReadFileTool`: Reads the contents of a file.
- `WriteFileTool`: Writes content to a file.
- `SearchCodeTool`: Searches for patterns in code.
- `TaskCompleteTool`: Indicates that the task is complete.

## Autonomous Session Flow

The autonomous session flow is implemented in the `runAutonomousSession` method of the `ClaudeClient` class. Here's a high-level overview of the flow:

1. **Initialization**:
   - Create a session ID
   - Create a context object
   - Initialize token usage tracking
   - Create a system message
   - Start the conversation with the user's prompt

2. **Iteration Loop**:
   - Get Claude's response
   - Update token usage
   - Add Claude's response to conversation history
   - Check if Claude used a tool
     - If yes, execute the tool and add the result to the conversation
     - If no, check if Claude indicates completion
       - If yes, mark the session as complete
       - If no, ask Claude if it needs to do anything else

3. **Completion**:
   - Return the session results, including:
     - Whether the session completed successfully
     - The number of iterations
     - The conversation history
     - Token usage statistics

## Tool Execution

Tool execution is handled by the `executeTool` method of the `ToolRegistry` class. Here's a high-level overview of the flow:

1. **Tool Lookup**:
   - Look up the tool by name
   - If the tool is not found, throw an error

2. **Input Validation**:
   - Validate the input against the tool's input schema
   - If validation fails, throw an error

3. **Tool Execution**:
   - Execute the tool with the validated input and context
   - Return the result

4. **Error Handling**:
   - If an error occurs during tool execution, catch it and return an error result

## Token Usage Tracking

Token usage tracking is implemented in the `runAutonomousSession` method of the `ClaudeClient` class. Here's a high-level overview of the implementation:

1. **Initialization**:
   - Initialize token usage tracking for the session

2. **Update on Response**:
   - Update token usage when a response is received from Claude
   - Track input tokens, output tokens, cache creation tokens, and cache read tokens

3. **Aggregation**:
   - Provide methods for aggregating token usage across sessions

## Error Handling

Error handling is implemented throughout the Claude client. Here are some key aspects of the error handling implementation:

1. **Tool Execution Errors**:
   - Catch errors that occur during tool execution
   - Return an error result to Claude
   - Log the error for debugging

2. **API Errors**:
   - Catch errors that occur when interacting with the Claude API
   - Log the error for debugging
   - Terminate the session if necessary

3. **Timeout Handling**:
   - Implement iteration limits to prevent sessions from running indefinitely
   - Log a warning if a session reaches the iteration limit

## Testing

The Claude client includes a test script that can be used to verify that the client works correctly. The test script:

1. Initializes the Claude client with configuration from environment variables
2. Runs an autonomous session with a simple prompt
3. Prints the results, including token usage statistics
4. Saves the conversation history to a file

## Extending the Client

To extend the client with new tools:

1. Create a new tool class that extends `BaseTool`
2. Implement the `execute` method
3. Register the tool in the `initializeTools` method of the `ClaudeClient` class

Example:

```typescript
export class MyNewTool extends BaseTool<
  typeof MyNewTool.inputSchema,
  typeof MyNewTool.outputSchema
> {
  static inputSchema = z.object({
    // Define input schema
  });
  
  static outputSchema = z.object({
    // Define output schema
  });
  
  constructor() {
    super(
      'my_new_tool',
      'Description of my new tool',
      MyNewTool.inputSchema,
      MyNewTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof MyNewTool.inputSchema>, context: ClaudeContext) {
    // Implement tool execution
  }
}
```

Then register the tool:

```typescript
private initializeTools(): void {
  // Register existing tools
  this.toolRegistry.registerTool(new ListFilesTool());
  this.toolRegistry.registerTool(new ReadFileTool());
  this.toolRegistry.registerTool(new WriteFileTool());
  this.toolRegistry.registerTool(new SearchCodeTool());
  this.toolRegistry.registerTool(new TaskCompleteTool());
  
  // Register new tool
  this.toolRegistry.registerTool(new MyNewTool());
}
```

## Performance Considerations

The Claude client is designed to be efficient, but there are some performance considerations to keep in mind:

1. **Token Usage**:
   - Claude has token limits, so be mindful of the size of the repository and the complexity of the task.
   - Use prompt caching to reduce token usage.

2. **Iteration Limits**:
   - Set appropriate iteration limits to prevent sessions from running indefinitely.
   - Monitor session progress to ensure that sessions are making progress.

3. **Tool Execution**:
   - Tool execution can be slow, especially for large repositories.
   - Consider implementing caching for tool results to improve performance.

4. **Error Handling**:
   - Robust error handling is important for ensuring that sessions don't fail unnecessarily.
   - Consider implementing retry logic for transient errors.

## Security Considerations

The Claude client interacts with the file system, so there are some security considerations to keep in mind:

1. **Path Validation**:
   - Validate file paths to prevent directory traversal attacks.
   - Ensure that file paths are within the repository directory.

2. **File Content Validation**:
   - Validate file content to prevent malicious code execution.
   - Consider implementing content validation for sensitive file types.

3. **API Key Security**:
   - Store API keys securely.
   - Consider using environment variables or a secrets manager.

4. **Tool Permissions**:
   - Consider implementing permission checks for tools.
   - Limit the tools that Claude can use based on the task.
