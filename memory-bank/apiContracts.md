## Claude 3.7 API Integration

### API Endpoints

#### Messages API (Required for Claude 3.7)

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Method**: POST
- **Headers**:
  - `Content-Type`: application/json
  - `x-api-key`: Claude API key
  - `anthropic-version`: 2023-06-01
  - `anthropic-beta`: messages-2023-12-15

**Request Body**:
```json
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 64000,
  "temperature": 0.5,
  "system": "You are an expert software engineer tasked with analyzing and modifying code in a repository.",
  "messages": [
    {
      "role": "user",
      "content": "Analyze this code..."
    }
  ],
  "tools": [
    {
      "name": "list_files",
      "description": "List files in a directory within the repository.",
      "input_schema": {
        "type": "object",
        "properties": {
          "directory": {
            "type": "string",
            "description": "The directory path relative to the repository root."
          }
        },
        "required": ["directory"]
      }
    }
  ]
}
```

### Tool-Based Interaction

The Claude client uses a tool-based approach for repository interaction:

1. **list_files**: List files in a directory
2. **read_file**: Read the contents of a file
3. **write_file**: Write content to a file
4. **search_code**: Search for patterns in code
5. **task_complete**: Indicate that the task is complete

Each tool has a defined input schema and output format. Claude can request to use these tools, and the client executes them and returns the results.

### Prompt Template for Code Updates

```
You are an expert software engineer tasked with updating code according to specific requirements.

TASK DESCRIPTION:
{prompt}

REPOSITORY INFORMATION:
- Name: {repository_name}

I will provide you with files from the repository that may need updates.
For each file, analyze if it needs changes and generate updated code if necessary.

FILE: {file_path}

```

{file_content}

```

Please analyze this file and determine if it needs changes according to the requirements.
Your response should be in the following format:

ANALYSIS:
[Your analysis of whether the file needs changes]

CHANGES_NECESSARY: [YES/NO]

UPDATED_CODE:
[If changes are necessary, provide the complete updated file content]

EXPLANATION:
[Explain the changes you made and why they address the requirements]
```

### Response Parsing

The Batch job parses Claude's response to extract:
- Whether changes are necessary
- The updated file content (if applicable)
- The explanation of changes
- Tool calls and results
- Token usage information

This information is used to generate diffs, create pull requests, and store the conversation history.