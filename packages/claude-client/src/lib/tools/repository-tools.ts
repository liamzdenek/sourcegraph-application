import { z } from 'zod';
import { BaseTool } from './tool-interface';
import { ClaudeContext } from '../claude-context';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Tool for listing files in a directory
 */
export class ListFilesTool extends BaseTool<
  typeof ListFilesTool.inputSchema,
  typeof ListFilesTool.outputSchema
> {
  static inputSchema = z.object({
    directory: z.string().describe('The directory path relative to the repository root. Use "." for the root directory.'),
    pattern: z.string().optional().describe('Optional glob pattern to filter files (e.g., "*.js" for JavaScript files).')
  });
  
  static outputSchema = z.object({
    files: z.array(z.string()).describe('List of files in the directory'),
    success: z.boolean().describe('Whether the operation was successful'),
    error: z.string().optional().describe('Error message if the operation failed')
  });
  
  constructor() {
    super(
      'list_files',
      'List files in a directory within the repository. Returns an array of file and directory names.',
      ListFilesTool.inputSchema,
      ListFilesTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof ListFilesTool.inputSchema>, context: ClaudeContext) {
    try {
      const directory = path.join(context.repositoryPath, input.directory);
      
      if (input.pattern) {
        const files = await glob(input.pattern, { cwd: directory });
        return { files, success: true };
      } else {
        const files = await fs.readdir(directory);
        return { files, success: true };
      }
    } catch (error) {
      return { 
        files: [], 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Tool for reading file contents
 */
export class ReadFileTool extends BaseTool<
  typeof ReadFileTool.inputSchema,
  typeof ReadFileTool.outputSchema
> {
  static inputSchema = z.object({
    path: z.string().describe('The file path relative to the repository root.')
  });
  
  static outputSchema = z.object({
    content: z.string().describe('The content of the file'),
    success: z.boolean().describe('Whether the operation was successful'),
    error: z.string().optional().describe('Error message if the operation failed')
  });
  
  constructor() {
    super(
      'read_file',
      'Read the contents of a file in the repository.',
      ReadFileTool.inputSchema,
      ReadFileTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof ReadFileTool.inputSchema>, context: ClaudeContext) {
    try {
      const filePath = path.join(context.repositoryPath, input.path);
      const content = await fs.readFile(filePath, 'utf8');
      return { content, success: true };
    } catch (error) {
      return { 
        content: '', 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Tool for writing to a file
 */
export class WriteFileTool extends BaseTool<
  typeof WriteFileTool.inputSchema,
  typeof WriteFileTool.outputSchema
> {
  static inputSchema = z.object({
    path: z.string().describe('The file path relative to the repository root.'),
    content: z.string().describe('The content to write to the file.')
  });
  
  static outputSchema = z.object({
    success: z.boolean().describe('Whether the operation was successful'),
    message: z.string().describe('Status message'),
    error: z.string().optional().describe('Error message if the operation failed')
  });
  
  constructor() {
    super(
      'write_file',
      'Write content to a file in the repository. Creates the file if it doesn\'t exist.',
      WriteFileTool.inputSchema,
      WriteFileTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof WriteFileTool.inputSchema>, context: ClaudeContext) {
    try {
      const filePath = path.join(context.repositoryPath, input.path);
      
      // Ensure directory exists
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      
      await fs.writeFile(filePath, input.content);
      return { 
        success: true, 
        message: `File ${input.path} written successfully.` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to write file',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Tool for searching code in the repository
 */
export class SearchCodeTool extends BaseTool<
  typeof SearchCodeTool.inputSchema,
  typeof SearchCodeTool.outputSchema
> {
  static inputSchema = z.object({
    pattern: z.string().describe('The search pattern (regular expression).'),
    directory: z.string().describe('The directory to search in, relative to the repository root. Use "." for the entire repository.'),
    file_pattern: z.string().optional().describe('Optional glob pattern to filter files to search (e.g., "*.js" for JavaScript files).')
  });
  
  static outputSchema = z.object({
    results: z.array(z.object({
      file: z.string(),
      matches: z.array(z.object({
        line: z.number(),
        content: z.string()
      }))
    })).describe('Search results with matching files and line numbers'),
    success: z.boolean().describe('Whether the operation was successful'),
    error: z.string().optional().describe('Error message if the operation failed')
  });
  
  constructor() {
    super(
      'search_code',
      'Search for a pattern in the repository code. Returns matching files and line numbers.',
      SearchCodeTool.inputSchema,
      SearchCodeTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof SearchCodeTool.inputSchema>, context: ClaudeContext) {
    try {
      const directory = path.join(context.repositoryPath, input.directory);
      const pattern = new RegExp(input.pattern);
      const filePattern = input.file_pattern || '**/*';
      
      const files = await glob(filePattern, { cwd: directory });
      const results = [];
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        try {
          const stats = await fs.stat(filePath);
          if (!stats.isFile()) continue;
          
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n');
          const matches = [];
          
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              matches.push({
                line: i + 1,
                content: lines[i]
              });
            }
          }
          
          if (matches.length > 0) {
            results.push({
              file,
              matches
            });
          }
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Skipping file ${file}: ${error}`);
        }
      }
      
      return { results, success: true };
    } catch (error) {
      return { 
        results: [], 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Tool for marking a task as complete
 */
export class TaskCompleteTool extends BaseTool<
  typeof TaskCompleteTool.inputSchema,
  typeof TaskCompleteTool.outputSchema
> {
  static inputSchema = z.object({
    summary: z.string().describe('A summary of all changes made to complete the task.'),
    files_modified: z.array(z.string()).optional().describe('List of files that were modified.')
  });
  
  static outputSchema = z.object({
    success: z.boolean().describe('Whether the operation was successful'),
    message: z.string().describe('Status message'),
    summary: z.string().describe('Summary of changes'),
    files_modified: z.array(z.string()).optional().describe('List of modified files')
  });
  
  constructor() {
    super(
      'task_complete',
      'Indicate that the task is complete and provide a summary of changes made.',
      TaskCompleteTool.inputSchema,
      TaskCompleteTool.outputSchema
    );
  }
  
  async execute(input: z.infer<typeof TaskCompleteTool.inputSchema>, context: ClaudeContext) {
    return { 
      success: true, 
      message: 'Task marked as complete.',
      summary: input.summary,
      files_modified: input.files_modified || []
    };
  }
}