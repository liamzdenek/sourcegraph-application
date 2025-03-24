# API Contracts: Cody Batch

This document defines the API contracts for all services in the Cody Batch system. It includes endpoint definitions, request/response formats, and sample curl commands for testing.

## API Gateway Endpoints

Base URL: `https://api.cody-batch.example.com` (placeholder, will be updated after deployment)

### Health Check

#### Get API Health

- **Endpoint**: `GET /health`
- **Description**: Checks API health status
- **Authentication**: None
- **Response**: Health status

**Response Body**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-03-24T12:00:00Z",
  "dependencies": {
    "dynamodb": "healthy",
    "github": "healthy",
    "claude": "healthy"
  }
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/health
```

### Repositories

#### List Available Repositories

- **Endpoint**: `GET /repositories`
- **Description**: Lists repositories that match the allowed patterns (github.com/liamzdenek/*)
- **Authentication**: None
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `perPage`: Items per page (default: 10)
  - `filter`: Filter by name (optional)
- **Response**: List of repositories

**Response Body**:
```json
{
  "repositories": [
    {
      "id": "repo1",
      "name": "liamzdenek/repo1",
      "description": "Repository description",
      "url": "https://github.com/liamzdenek/repo1"
    },
    {
      "id": "repo2",
      "name": "liamzdenek/repo2",
      "description": "Another repository",
      "url": "https://github.com/liamzdenek/repo2"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Sample Curl**:
```bash
curl -v "https://api.cody-batch.example.com/repositories?page=1&perPage=10"
```

### Jobs

#### Create Job

- **Endpoint**: `POST /jobs`
- **Description**: Creates a new job
- **Authentication**: None
- **Request Body**: Job configuration
- **Response**: Created job

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Update code patterns",
  "description": "Apply a specific code change across repositories",
  "type": "code-pattern-update",
  "prompt": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of 'oldFunction(param)' with 'newFunction(param, { version: 2 })'.",
  "repositories": [
    "liamzdenek/repo1",
    "liamzdenek/repo2"
  ],
  "createPullRequests": true
}
```

**Response Body**:
```json
{
  "jobId": "job-123",
  "name": "Update code patterns",
  "description": "Apply a specific code change across repositories",
  "type": "code-pattern-update",
  "prompt": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of 'oldFunction(param)' with 'newFunction(param, { version: 2 })'.",
  "repositories": [
    "liamzdenek/repo1",
    "liamzdenek/repo2"
  ],
  "createPullRequests": true,
  "status": "pending",
  "createdAt": "2025-03-24T12:00:00Z"
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Update code patterns",
    "description": "Apply a specific code change across repositories",
    "type": "code-pattern-update",
    "prompt": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of '\''oldFunction(param)'\'' with '\''newFunction(param, { version: 2 })'\''.",
    "repositories": [
      "liamzdenek/repo1",
      "liamzdenek/repo2"
    ],
    "createPullRequests": true
  }'
```

#### List Jobs

- **Endpoint**: `GET /jobs`
- **Description**: Lists all jobs
- **Authentication**: None
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `perPage`: Items per page (default: 10)
  - `status`: Filter by status (optional)
- **Response**: List of jobs

**Response Body**:
```json
{
  "jobs": [
    {
      "jobId": "job-123",
      "name": "Update code patterns",
      "type": "code-pattern-update",
      "status": "in-progress",
      "createdAt": "2025-03-24T12:00:00Z",
      "repositoryCount": 2,
      "completedCount": 1
    },
    {
      "jobId": "job-124",
      "name": "Fix security vulnerabilities",
      "type": "vulnerability-fix",
      "status": "completed",
      "createdAt": "2025-03-23T12:00:00Z",
      "repositoryCount": 1,
      "completedCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Sample Curl**:
```bash
curl -v "https://api.cody-batch.example.com/jobs?page=1&perPage=10"
```

#### Get Job Details

- **Endpoint**: `GET /jobs/:jobId`
- **Description**: Gets detailed information about a job
- **Authentication**: None
- **Path Parameters**:
  - `jobId`: Job ID
- **Response**: Job details

**Response Body**:
```json
{
  "jobId": "job-123",
  "name": "Update code patterns",
  "description": "Apply a specific code change across repositories",
  "type": "code-pattern-update",
  "prompt": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of 'oldFunction(param)' with 'newFunction(param, { version: 2 })'.",
  "repositories": [
    {
      "name": "liamzdenek/repo1",
      "status": "completed",
      "pullRequestUrl": "https://github.com/liamzdenek/repo1/pull/1",
      "wereChangesNecessary": true,
      "completedAt": "2025-03-24T12:30:00Z"
    },
    {
      "name": "liamzdenek/repo2",
      "status": "in-progress",
      "pullRequestUrl": null,
      "wereChangesNecessary": null,
      "completedAt": null
    }
  ],
  "createPullRequests": true,
  "status": "in-progress",
  "createdAt": "2025-03-24T12:00:00Z",
  "startedAt": "2025-03-24T12:01:00Z",
  "completedAt": null
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123
```

#### Cancel Job

- **Endpoint**: `POST /jobs/:jobId/cancel`
- **Description**: Cancels a running job
- **Authentication**: None
- **Path Parameters**:
  - `jobId`: Job ID
- **Response**: Updated job status

**Response Body**:
```json
{
  "jobId": "job-123",
  "status": "cancelled",
  "cancelledAt": "2025-03-24T12:45:00Z"
}
```

**Sample Curl**:
```bash
curl -v -X POST https://api.cody-batch.example.com/jobs/job-123/cancel
```

### Repository Results

#### Get Repository Job Result

- **Endpoint**: `GET /jobs/:jobId/repositories/:repoName`
- **Description**: Gets detailed results for a specific repository in a job
- **Authentication**: None
- **Path Parameters**:
  - `jobId`: Job ID
  - `repoName`: Repository name (e.g., "liamzdenek/repo1")
- **Response**: Repository job result

**Response Body**:
```json
{
  "jobId": "job-123",
  "repositoryName": "liamzdenek/repo1",
  "status": "completed",
  "pullRequestUrl": "https://github.com/liamzdenek/repo1/pull/1",
  "wereChangesNecessary": true,
  "startedAt": "2025-03-24T12:05:00Z",
  "completedAt": "2025-03-24T12:30:00Z",
  "changes": [
    {
      "file": "src/api.js",
      "diff": "--- a/src/api.js\n+++ b/src/api.js\n@@ -10,7 +10,7 @@\n function fetchData(id) {\n-  return oldFunction(id);\n+  return newFunction(id, { version: 2 });\n }"
    },
    {
      "file": "src/utils.js",
      "diff": "--- a/src/utils.js\n+++ b/src/utils.js\n@@ -15,7 +15,7 @@\n function processItem(item) {\n-  const result = oldFunction(item.id);\n+  const result = newFunction(item.id, { version: 2 });\n   return result;\n }"
    }
  ],
  "claudeMessages": {
    "finalMessage": "I've updated all instances of the deprecated API call `oldFunction(param)` to use the new format `newFunction(param, { version: 2 })`. I found and updated 2 occurrences across 2 files.",
    "threadId": "thread-123"
  },
  "logs": [
    {
      "timestamp": "2025-03-24T12:05:00Z",
      "level": "INFO",
      "message": "Starting repository analysis"
    },
    {
      "timestamp": "2025-03-24T12:10:00Z",
      "level": "INFO",
      "message": "Found deprecated API call in src/api.js"
    },
    {
      "timestamp": "2025-03-24T12:15:00Z",
      "level": "INFO",
      "message": "Found deprecated API call in src/utils.js"
    },
    {
      "timestamp": "2025-03-24T12:20:00Z",
      "level": "INFO",
      "message": "Generated fixes for affected files"
    },
    {
      "timestamp": "2025-03-24T12:25:00Z",
      "level": "INFO",
      "message": "Creating pull request"
    },
    {
      "timestamp": "2025-03-24T12:30:00Z",
      "level": "INFO",
      "message": "Pull request created: https://github.com/liamzdenek/repo1/pull/1"
    }
  ]
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123/repositories/liamzdenek%2Frepo1
```

#### Get Repository Diff

- **Endpoint**: `GET /jobs/:jobId/repositories/:repoName/diff`
- **Description**: Gets the full diff for a repository in a job
- **Authentication**: None
- **Path Parameters**:
  - `jobId`: Job ID
  - `repoName`: Repository name (e.g., "liamzdenek/repo1")
- **Response**: Full diff as text/plain

**Response Body**:
```
diff --git a/src/api.js b/src/api.js
index 1234567..abcdefg 100644
--- a/src/api.js
+++ b/src/api.js
@@ -10,7 +10,7 @@ function fetchData(id) {
-  return oldFunction(id);
+  return newFunction(id, { version: 2 });
 }

diff --git a/src/utils.js b/src/utils.js
index 7654321..gfedcba 100644
--- a/src/utils.js
+++ b/src/utils.js
@@ -15,7 +15,7 @@ function processItem(item) {
-  const result = oldFunction(item.id);
+  const result = newFunction(item.id, { version: 2 });
   return result;
 }
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123/repositories/liamzdenek%2Frepo1/diff
```

#### Get Claude Message Thread

- **Endpoint**: `GET /jobs/:jobId/repositories/:repoName/claude-thread`
- **Description**: Gets the full Claude message thread for a repository in a job
- **Authentication**: None
- **Path Parameters**:
  - `jobId`: Job ID
  - `repoName`: Repository name (e.g., "liamzdenek/repo1")
- **Response**: Full Claude message thread

**Response Body**:
```json
{
  "threadId": "thread-123",
  "messages": [
    {
      "role": "human",
      "content": "You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of 'oldFunction(param)' with 'newFunction(param, { version: 2 })'. Here's the first file to analyze:\n\nsrc/api.js:\n```javascript\nfunction fetchData(id) {\n  return oldFunction(id);\n}\n```",
      "timestamp": "2025-03-24T12:10:00Z"
    },
    {
      "role": "assistant",
      "content": "I'll update the deprecated API call in this file. Here's the change I'll make:\n\n```javascript\nfunction fetchData(id) {\n  return newFunction(id, { version: 2 });\n}\n```\n\nThis replaces the deprecated `oldFunction(param)` with the new format `newFunction(param, { version: 2 })` as requested.",
      "timestamp": "2025-03-24T12:10:30Z"
    },
    {
      "role": "human",
      "content": "Here's another file to analyze:\n\nsrc/utils.js:\n```javascript\nfunction processItem(item) {\n  const result = oldFunction(item.id);\n  return result;\n}\n```",
      "timestamp": "2025-03-24T12:15:00Z"
    },
    {
      "role": "assistant",
      "content": "I'll update the deprecated API call in this file as well. Here's the change I'll make:\n\n```javascript\nfunction processItem(item) {\n  const result = newFunction(item.id, { version: 2 });\n  return result;\n}\n```\n\nThis replaces the deprecated `oldFunction(param)` with the new format `newFunction(param, { version: 2 })` as requested.",
      "timestamp": "2025-03-24T12:15:30Z"
    },
    {
      "role": "human",
      "content": "Please summarize all the changes you've made.",
      "timestamp": "2025-03-24T12:20:00Z"
    },
    {
      "role": "assistant",
      "content": "I've updated all instances of the deprecated API call `oldFunction(param)` to use the new format `newFunction(param, { version: 2 })`. I found and updated 2 occurrences across 2 files:\n\n1. In `src/api.js`: Updated the call in the `fetchData` function\n2. In `src/utils.js`: Updated the call in the `processItem` function\n\nAll instances have been successfully updated to use the new API format.",
      "timestamp": "2025-03-24T12:20:30Z"
    }
  ]
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123/repositories/liamzdenek%2Frepo1/claude-thread
```

## AWS Batch Job

The job processing is handled by AWS Batch jobs. These are not directly accessible via API Gateway but are submitted by the API Lambda.

### Job Processing Flow

1. **Job Creation**:
   - API Lambda creates a job record in DynamoDB
   - API Lambda submits a job to AWS Batch

2. **Batch Job Execution**:
   - Batch job retrieves job details from DynamoDB
   - For each repository:
     - Clone repository
     - Analyze code based on the prompt
     - Generate changes using Claude 3.7
     - Create pull request or store diff
     - Update repository status in DynamoDB
   - Update job status in DynamoDB

### Batch Job Parameters

```json
{
  "jobId": "job-123",
  "maxRepositories": 5
}
```

### Batch Job Environment Variables

- `GITHUB_TOKEN`: GitHub service account token
- `CLAUDE_API_KEY`: Claude 3.7 API key
- `DYNAMODB_JOBS_TABLE`: DynamoDB table for jobs
- `DYNAMODB_REPOSITORIES_TABLE`: DynamoDB table for repositories
- `ALLOWED_REPOSITORIES`: Comma-separated list of allowed repository patterns

## DynamoDB Schema

### Jobs Table

**Table Name**: `cody-batch-{environment}-jobs`

**Primary Key**:
- Partition Key: `jobId` (String)

**Attributes**:
- `jobId` (String): Unique identifier for the job
- `name` (String): Job name
- `description` (String): Job description
- `type` (String): Job type (e.g., "code-pattern-update", "vulnerability-fix")
- `prompt` (String): Claude prompt for code analysis
- `repositories` (List): List of repositories to process
- `createPullRequests` (Boolean): Whether to create pull requests
- `status` (String): Job status (pending, in-progress, completed, failed, cancelled)
- `createdAt` (Number): Timestamp when the job was created
- `startedAt` (Number): Timestamp when the job started processing
- `completedAt` (Number): Timestamp when the job completed
- `error` (String): Error message if the job failed

### Repositories Table

**Table Name**: `cody-batch-{environment}-repositories`

**Primary Key**:
- Partition Key: `jobId` (String)
- Sort Key: `repositoryName` (String)

**Attributes**:
- `jobId` (String): Job ID
- `repositoryName` (String): Repository name (e.g., "liamzdenek/repo1")
- `status` (String): Repository processing status
- `pullRequestUrl` (String): URL of the created pull request
- `wereChangesNecessary` (Boolean): Whether changes were necessary
- `startedAt` (Number): Timestamp when processing started
- `completedAt` (Number): Timestamp when processing completed
- `changes` (List): List of file changes
- `diff` (String): Full diff of changes
- `claudeMessages` (Map): Claude message information
  - `finalMessage` (String): Final summary message from Claude
  - `threadId` (String): ID of the message thread
- `logs` (List): Processing logs
- `error` (String): Error message if processing failed

## Claude 3.7 API Integration

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

This information is used to generate diffs and create pull requests.

## GitHub API Integration

### Repository Cloning

```bash
git clone https://github.com/{repository_name}.git
```

### Pull Request Creation

**API Endpoint**: `POST /repos/{owner}/{repo}/pulls`

**Request Body**:
```json
{
  "title": "Update code patterns",
  "body": "This pull request updates deprecated API calls to use the new format.\n\nChanges were automatically generated by Cody Batch.",
  "head": "update/code-patterns",
  "base": "main"
}
```

**Response**:
```json
{
  "url": "https://api.github.com/repos/liamzdenek/repo1/pulls/1",
  "id": 1,
  "number": 1,
  "state": "open",
  "title": "Update code patterns",
  "html_url": "https://github.com/liamzdenek/repo1/pull/1"
}