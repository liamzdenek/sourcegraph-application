# Project Brief: Cody Batch - Autonomous Repository Remediation

## Overview
Cody Batch is an AI-powered tool that leverages Claude 3.7 to perform bulk changes on GitHub repositories. It's designed to automatically identify and fix issues like security vulnerabilities (e.g., Log4J CVE) by ensuring dependencies are updated or replaced. The system can automatically create pull requests for owned repositories or generate diffs for non-owned repositories.

## Core Requirements

### Functional Requirements
- Scan GitHub repositories for specific patterns or vulnerabilities
- Use Claude 3.7 to analyze code and generate fixes
- Automatically create pull requests for repositories owned by the user (limited to github.com/liamzdenek/*)
- Generate and store diffs for non-owned repositories
- Provide a dashboard to manage jobs and view results
- Support GitHub OAuth for API access

### Technical Requirements
- Implement as a 12-Factor app with cloud-native principles
- Use Nx monorepo structure with packages in the 'packages' directory
- Frontend: React with TypeScript and CSS modules (no Tailwind or CSS frameworks)
- Backend: NodeJS with Express, deployed to AWS Lambda and API Gateway
- Database: DynamoDB for job and result storage
- Infrastructure: AWS CDK for deployment
- Routing: Tanstack Router (not React Router)
- Schema Validation: Zod
- Single output 'dist' directory at the root with subfolders for each package

### Non-Functional Requirements
- Production-ready, highly scalable architecture
- Comprehensive error handling and logging
- Security-focused design, especially for GitHub API integration
- Performance optimized for batch processing

## Out of Scope
- CI/CD pipeline setup
- E2E testing with Playwright or similar tools
- Local development environment with mocks
- Support for repositories outside github.com/liamzdenek/*
- Support for non-GitHub repositories

## Success Criteria
- Successfully scan repositories and identify issues
- Generate correct fixes using Claude 3.7
- Create valid pull requests for owned repositories
- Provide clear, usable diffs for non-owned repositories
- Deploy a working system to AWS
- Demonstrate scalability for processing multiple repositories