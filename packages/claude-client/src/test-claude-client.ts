import { ClaudeClient } from './lib/claude-client';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test the Claude client with a simple repository
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const repositoryPathArg = args[0] || process.cwd();
  const prompt = args[1] || 'Analyze this repository and list all the files.';
  const maxIterations = parseInt(args[2] || '10');
  
  // Get the current working directory
  const cwd = process.cwd();
  console.log(`Current working directory: ${cwd}`);
  
  // Try different ways to resolve the repository path
  let repositoryPath = path.resolve(cwd, repositoryPathArg);
  
  // Check if repository path exists
  try {
    const stats = await fs.promises.stat(repositoryPath);
    if (!stats.isDirectory()) {
      console.error(`Error: ${repositoryPath} is not a directory`);
      process.exit(1);
    }
  } catch (error) {
    // Try to find the test-project directory in the current working directory
    if (repositoryPathArg.includes('test-project')) {
      const testProjectPath = path.join(cwd, 'test-project');
      try {
        const stats = await fs.promises.stat(testProjectPath);
        if (stats.isDirectory()) {
          repositoryPath = testProjectPath;
          console.log(`Found test-project at: ${repositoryPath}`);
        }
      } catch (error) {
        // Ignore
      }
    }
    
    // Check again if the repository path exists
    try {
      const stats = await fs.promises.stat(repositoryPath);
      if (!stats.isDirectory()) {
        console.error(`Error: ${repositoryPath} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${repositoryPath} does not exist`);
      process.exit(1);
    }
  }
  
  console.log(`Repository path argument: ${repositoryPathArg}`);
  console.log(`Resolved repository path: ${repositoryPath}`);
  console.log(`Prompt: ${prompt}`);
  console.log(`Max iterations: ${maxIterations}`);
  
  // Initialize Claude client
  const claudeClient = new ClaudeClient({
    apiKey: process.env['CLAUDE_API_KEY'] || '',
    model: process.env['CLAUDE_MODEL'] || 'claude-3-7-sonnet-20250219',
    maxTokens: parseInt(process.env['CLAUDE_MAX_TOKENS'] || '64000'),
    temperature: parseFloat(process.env['CLAUDE_TEMPERATURE'] || '0.5')
  });
  
  // Run autonomous session
  console.log('Starting autonomous session...');
  const result = await claudeClient.runAutonomousSession(
    repositoryPath,
    prompt,
    maxIterations
  );
  
  // Print results
  console.log(`\nSession completed after ${result.iterations} iterations`);
  console.log(`Complete: ${result.complete}`);
  console.log(`Token usage: ${JSON.stringify(result.tokenUsage)}`);
  
  // Save conversation history to file
  const outputPath = path.join(process.cwd(), 'claude-session.json');
  fs.writeFileSync(
    outputPath, 
    JSON.stringify(result.conversationHistory, null, 2)
  );
  console.log(`Conversation history saved to ${outputPath}`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});