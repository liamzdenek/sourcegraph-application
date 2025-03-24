# Batch Job Parameters Issue

## Problem
When running the batch processor, the following error was observed:
```
2025-03-24T20:21:42.713Z
Starting Cody Batch processor
2025-03-24T20:21:42.714Z
Job ID is required
```

Despite the job having the parameters "jobId" and "maxRepositories" provided in the AWS dashboard.

## Root Cause
The batch processor in `packages/batch/src/main.ts` was expecting to receive the job ID and max repositories as command line arguments:

```javascript
// Get job ID from command line arguments
const jobId = process.argv[2];
if (!jobId) {
  console.error('Job ID is required');
  process.exit(1);
}

// Get max repositories from command line arguments (default: 5)
const maxRepositories = process.argv[3] ? parseInt(process.argv[3]) : 5;
```

However, when AWS Batch runs a container job, it passes the job parameters as environment variables to the container, not as command line arguments.

## Solution
Modified the batch processor to read the parameters from environment variables instead of command line arguments:

```javascript
// Get job ID from environment variables (AWS Batch parameters)
const jobId = process.env.jobId;
if (!jobId) {
  console.error('Job ID is required');
  process.exit(1);
}

// Get max repositories from environment variables (default: 5)
const maxRepositories = process.env.maxRepositories ? parseInt(process.env.maxRepositories) : 5;
```

This change allows the batch processor to correctly receive the parameters passed from the AWS Batch job submission.

## Related Files
- `packages/batch/src/main.ts` - The main entry point for the batch processor
- `packages/api/src/routes/jobs.ts` - Where jobs are submitted to AWS Batch
- `packages/batch/Dockerfile` - The Docker container configuration

## Testing
After making this change, the batch processor should successfully receive the job ID and max repositories parameters from AWS Batch.