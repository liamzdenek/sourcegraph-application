# API Contracts: Cody Batch

This document defines the API contracts for all services in the Cody Batch system. It includes endpoint definitions, request/response formats, and sample curl commands for testing.

## API Gateway Endpoints

Base URL: `https://api.cody-batch.example.com` (placeholder, will be updated after deployment)

### Authentication

#### GitHub OAuth Initialization

- **Endpoint**: `GET /auth/github`
- **Description**: Initiates GitHub OAuth flow
- **Response**: Redirects to GitHub authorization page

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/auth/github
```

#### GitHub OAuth Callback

- **Endpoint**: `GET /auth/github/callback`
- **Description**: Handles GitHub OAuth callback
- **Query Parameters**:
  - `code`: OAuth authorization code
  - `state`: State parameter for CSRF protection
- **Response**: Redirects to frontend with access token

**Sample Curl**:
```bash
# This is handled by the browser during OAuth flow
curl -v "https://api.cody-batch.example.com/auth/github/callback?code=abc123&state=xyz789"
```

#### Get Current User

- **Endpoint**: `GET /auth/user`
- **Description**: Returns information about the authenticated user
- **Authentication**: Bearer token
- **Response**: User information

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "id": "12345",
  "login": "username",
  "name": "User Name",
  "avatarUrl": "https://github.com/avatars/u/12345"
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/auth/user \
  -H "Authorization: Bearer github-token"
```

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

#### List User Repositories

- **Endpoint**: `GET /repositories`
- **Description**: Lists repositories accessible to the authenticated user
- **Authentication**: Bearer token
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `perPage`: Items per page (default: 10)
  - `filter`: Filter by name (optional)
- **Response**: List of repositories

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "repositories": [
    {
      "id": "repo1",
      "name": "liamzdenek/repo1",
      "description": "Repository description",
      "url": "https://github.com/liamzdenek/repo1",
      "isOwned": true
    },
    {
      "id": "repo2",
      "name": "liamzdenek/repo2",
      "description": "Another repository",
      "url": "https://github.com/liamzdenek/repo2",
      "isOwned": true
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
curl -v "https://api.cody-batch.example.com/repositories?page=1&perPage=10" \
  -H "Authorization: Bearer github-token"
```

#### Get Repository Details

- **Endpoint**: `GET /repositories/:repoId`
- **Description**: Gets detailed information about a repository
- **Authentication**: Bearer token
- **Path Parameters**:
  - `repoId`: Repository ID
- **Response**: Repository details

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "id": "repo1",
  "name": "liamzdenek/repo1",
  "description": "Repository description",
  "url": "https://github.com/liamzdenek/repo1",
  "isOwned": true,
  "defaultBranch": "main",
  "language": "JavaScript",
  "stars": 10,
  "forks": 2,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2025-03-01T00:00:00Z"
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/repositories/repo1 \
  -H "Authorization: Bearer github-token"
```

### Jobs

#### Create Job

- **Endpoint**: `POST /jobs`
- **Description**: Creates a new job
- **Authentication**: Bearer token
- **Request Body**: Job configuration
- **Response**: Created job

**Request Headers**:
```
Authorization: Bearer <github-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Fix Log4J CVE",
  "description": "Update Log4J to version 2.15.0 or higher",
  "type": "vulnerability-fix",
  "parameters": {
    "vulnerability": "log4j",
    "targetVersion": "2.15.0"
  },
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
  "name": "Fix Log4J CVE",
  "description": "Update Log4J to version 2.15.0 or higher",
  "type": "vulnerability-fix",
  "parameters": {
    "vulnerability": "log4j",
    "targetVersion": "2.15.0"
  },
  "repositories": [
    "liamzdenek/repo1",
    "liamzdenek/repo2"
  ],
  "createPullRequests": true,
  "status": "pending",
  "createdAt": "2025-03-24T12:00:00Z",
  "createdBy": "username"
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs \
  -H "Authorization: Bearer github-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fix Log4J CVE",
    "description": "Update Log4J to version 2.15.0 or higher",
    "type": "vulnerability-fix",
    "parameters": {
      "vulnerability": "log4j",
      "targetVersion": "2.15.0"
    },
    "repositories": [
      "liamzdenek/repo1",
      "liamzdenek/repo2"
    ],
    "createPullRequests": true
  }'
```

#### List Jobs

- **Endpoint**: `GET /jobs`
- **Description**: Lists jobs created by the authenticated user
- **Authentication**: Bearer token
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `perPage`: Items per page (default: 10)
  - `status`: Filter by status (optional)
- **Response**: List of jobs

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "jobs": [
    {
      "jobId": "job-123",
      "name": "Fix Log4J CVE",
      "type": "vulnerability-fix",
      "status": "in-progress",
      "createdAt": "2025-03-24T12:00:00Z",
      "repositoryCount": 2,
      "completedCount": 1
    },
    {
      "jobId": "job-124",
      "name": "Update dependencies",
      "type": "dependency-update",
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
curl -v "https://api.cody-batch.example.com/jobs?page=1&perPage=10" \
  -H "Authorization: Bearer github-token"
```

#### Get Job Details

- **Endpoint**: `GET /jobs/:jobId`
- **Description**: Gets detailed information about a job
- **Authentication**: Bearer token
- **Path Parameters**:
  - `jobId`: Job ID
- **Response**: Job details

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "jobId": "job-123",
  "name": "Fix Log4J CVE",
  "description": "Update Log4J to version 2.15.0 or higher",
  "type": "vulnerability-fix",
  "parameters": {
    "vulnerability": "log4j",
    "targetVersion": "2.15.0"
  },
  "repositories": [
    {
      "name": "liamzdenek/repo1",
      "status": "completed",
      "pullRequestUrl": "https://github.com/liamzdenek/repo1/pull/1",
      "completedAt": "2025-03-24T12:30:00Z"
    },
    {
      "name": "liamzdenek/repo2",
      "status": "in-progress",
      "pullRequestUrl": null,
      "completedAt": null
    }
  ],
  "createPullRequests": true,
  "status": "in-progress",
  "createdAt": "2025-03-24T12:00:00Z",
  "createdBy": "username",
  "startedAt": "2025-03-24T12:01:00Z",
  "completedAt": null
}
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123 \
  -H "Authorization: Bearer github-token"
```

#### Cancel Job

- **Endpoint**: `POST /jobs/:jobId/cancel`
- **Description**: Cancels a running job
- **Authentication**: Bearer token
- **Path Parameters**:
  - `jobId`: Job ID
- **Response**: Updated job status

**Request Headers**:
```
Authorization: Bearer <github-token>
```

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
curl -v -X POST https://api.cody-batch.example.com/jobs/job-123/cancel \
  -H "Authorization: Bearer github-token"
```

### Repository Results

#### Get Repository Job Result

- **Endpoint**: `GET /jobs/:jobId/repositories/:repoId`
- **Description**: Gets detailed results for a specific repository in a job
- **Authentication**: Bearer token
- **Path Parameters**:
  - `jobId`: Job ID
  - `repoId`: Repository ID
- **Response**: Repository job result

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```json
{
  "jobId": "job-123",
  "repositoryName": "liamzdenek/repo1",
  "status": "completed",
  "pullRequestUrl": "https://github.com/liamzdenek/repo1/pull/1",
  "startedAt": "2025-03-24T12:05:00Z",
  "completedAt": "2025-03-24T12:30:00Z",
  "changes": [
    {
      "file": "pom.xml",
      "diff": "--- a/pom.xml\n+++ b/pom.xml\n@@ -10,7 +10,7 @@\n     <dependency>\n       <groupId>org.apache.logging.log4j</groupId>\n       <artifactId>log4j-core</artifactId>\n-      <version>2.14.0</version>\n+      <version>2.15.0</version>\n     </dependency>"
    },
    {
      "file": "build.gradle",
      "diff": "--- a/build.gradle\n+++ b/build.gradle\n@@ -15,7 +15,7 @@\n dependencies {\n-    implementation 'org.apache.logging.log4j:log4j-core:2.14.0'\n+    implementation 'org.apache.logging.log4j:log4j-core:2.15.0'\n     testImplementation 'junit:junit:4.13.2'\n }"
    }
  ],
  "analysisDetails": {
    "vulnerabilityDetected": true,
    "affectedFiles": 2,
    "claudePromptTokens": 1500,
    "claudeResponseTokens": 800
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
      "message": "Detected Log4J vulnerability in pom.xml"
    },
    {
      "timestamp": "2025-03-24T12:15:00Z",
      "level": "INFO",
      "message": "Detected Log4J vulnerability in build.gradle"
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
curl -v https://api.cody-batch.example.com/jobs/job-123/repositories/repo1 \
  -H "Authorization: Bearer github-token"
```

#### Get Repository Diff

- **Endpoint**: `GET /jobs/:jobId/repositories/:repoId/diff`
- **Description**: Gets the full diff for a repository in a job
- **Authentication**: Bearer token
- **Path Parameters**:
  - `jobId`: Job ID
  - `repoId`: Repository ID
- **Response**: Full diff

**Request Headers**:
```
Authorization: Bearer <github-token>
```

**Response Body**:
```
diff --git a/pom.xml b/pom.xml
index 1234567..abcdefg 100644
--- a/pom.xml
+++ b/pom.xml
@@ -10,7 +10,7 @@
     <dependency>
       <groupId>org.apache.logging.log4j</groupId>
       <artifactId>log4j-core</artifactId>
-      <version>2.14.0</version>
+      <version>2.15.0</version>
     </dependency>

diff --git a/build.gradle b/build.gradle
index 7654321..gfedcba 100644
--- a/build.gradle
+++ b/build.gradle
@@ -15,7 +15,7 @@
 dependencies {
-    implementation 'org.apache.logging.log4j:log4j-core:2.14.0'
+    implementation 'org.apache.logging.log4j:log4j-core:2.15.0'
     testImplementation 'junit:junit:4.13.2'
 }
```

**Sample Curl**:
```bash
curl -v https://api.cody-batch.example.com/jobs/job-123/repositories/repo1/diff \
  -H "Authorization: Bearer github-token"
```

## Worker Lambda

The Worker Lambda is not directly accessible via API Gateway. It is triggered by events and processes jobs asynchronously.

### Job Processing Flow

1. **Job Creation**:
   - API Lambda creates a job record in DynamoDB
   - API Lambda triggers the Worker Lambda

2. **Worker Lambda Execution**:
   - Worker Lambda retrieves job details from DynamoDB
   - For each repository:
     - Clone repository
     - Analyze code for vulnerabilities
     - Generate fixes using Claude 3.7
     - Create pull request or store diff
     - Update repository status in DynamoDB
   - Update job status in DynamoDB

### Worker Lambda Input Event

```json
{
  "jobId": "job-123"
}
```

### Worker Lambda Environment Variables

- `GITHUB_APP_ID`: GitHub App ID for authentication
- `GITHUB_APP_PRIVATE_KEY`: GitHub App private key
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
- `type` (String): Job type (e.g., "vulnerability-fix", "dependency-update")
- `parameters` (Map): Job-specific parameters
- `repositories` (List): List of repositories to process
- `createPullRequests` (Boolean): Whether to create pull requests
- `status` (String): Job status (pending, in-progress, completed, failed, cancelled)
- `createdAt` (Number): Timestamp when the job was created
- `createdBy` (String): GitHub username of the creator
- `startedAt` (Number): Timestamp when the job started processing
- `completedAt` (Number): Timestamp when the job completed
- `error` (String): Error message if the job failed

**Global Secondary Indexes**:
- `createdBy-createdAt-index`:
  - Partition Key: `createdBy` (String)
  - Sort Key: `createdAt` (Number)

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
- `startedAt` (Number): Timestamp when processing started
- `completedAt` (Number): Timestamp when processing completed
- `changes` (List): List of file changes
- `diff` (String): Full diff of changes
- `analysisDetails` (Map): Details about the analysis
- `logs` (List): Processing logs
- `error` (String): Error message if processing failed

## Claude 3.7 API Integration

### Prompt Template for Vulnerability Fix

```
You are an expert software engineer tasked with fixing a security vulnerability in a codebase.

VULNERABILITY DETAILS:
- Type: {vulnerability_type}
- Description: {vulnerability_description}
- Fix: {fix_description}

REPOSITORY INFORMATION:
- Name: {repository_name}
- Language: {repository_language}

I will provide you with files from the repository that may contain the vulnerability.
For each file, analyze if it contains the vulnerability and generate a fix if needed.

FILE: {file_path}

```

{file_content}

```

Please analyze this file and determine if it contains the vulnerability.
If it does, provide a fix that addresses the vulnerability while maintaining compatibility.

Your response should be in the following format:

ANALYSIS:
[Your analysis of whether the file contains the vulnerability]

CONTAINS_VULNERABILITY: [YES/NO]

FIX:
[If the file contains the vulnerability, provide the complete fixed file content]

EXPLANATION:
[Explain the changes you made and why they fix the vulnerability]
```

### Response Parsing

The Worker Lambda parses Claude's response to extract:
- Whether the file contains the vulnerability
- The fixed file content (if applicable)
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
  "title": "Fix Log4J vulnerability",
  "body": "This pull request updates Log4J to version 2.15.0 to address CVE-2021-44228.\n\nChanges were automatically generated by Cody Batch.",
  "head": "fix/log4j-vulnerability",
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
  "title": "Fix Log4J vulnerability",
  "html_url": "https://github.com/liamzdenek/repo1/pull/1"
}