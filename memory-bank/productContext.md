# Product Context: Cody Batch

## Why This Project Exists
Cody Batch is designed as a showcase application to demonstrate the potential of AI-powered code modification at scale. It serves as both a practical tool for repository maintenance and a demonstration of the applicant's technical skills and understanding of Sourcegraph's vision for AI coding agents.

The project aligns with Steve Yegge's vision (as described in his blog post "Revenge of the junior developer") of AI coding agents that can work autonomously on specific tasks, demonstrating how AI can be leveraged to solve real-world software engineering problems at scale.

## Problems It Solves

### For Repository Owners
1. **Code Maintenance at Scale**: Automatically applies changes across multiple repositories based on specific prompts.
2. **Technical Debt Reduction**: Enables bulk updates to outdated dependencies, deprecated code patterns, or other technical debt.
3. **Consistency Enforcement**: Ensures coding standards and best practices are applied uniformly across repositories.
4. **Time Savings**: Reduces manual effort required for repetitive code maintenance tasks.

### For Sourcegraph (as a job application showcase)
1. **Demonstrates Understanding**: Shows deep understanding of Sourcegraph's vision for AI coding agents.
2. **Technical Proficiency**: Showcases ability to build complex, production-ready systems.
3. **Innovation**: Presents a novel application of Claude 3.7 for autonomous code modification.
4. **Alignment**: Aligns with Sourcegraph's mission to make code changes and understanding more accessible.

## How It Should Work

### User Flow
1. **Job Creation**: User specifies a prompt for code changes and selects up to 5 target repositories.
2. **Job Processing**: System scans repositories, analyzes code, and generates changes using Claude 3.7.
3. **Result Delivery**: 
   - For owned repositories: Creates pull requests with changes
   - For all repositories: Generates diffs for download
4. **Result Review**: User can view job results, download patch files, and review Claude message threads.
5. **Monitoring**: User can track job progress and view results through the dashboard.

### System Flow
1. **Repository Scanning**: Identify repositories matching criteria and clone/analyze them.
2. **Code Analysis**: Scan code based on the provided prompt.
3. **Change Generation**: Use Claude 3.7 to generate appropriate changes.
4. **Validation**: Verify that generated changes address the requirements.
5. **Delivery**: Create pull requests or store diffs based on repository ownership.
6. **Reporting**: Provide detailed reports on actions taken and results.

### Technical Flow
1. **API Lambda**: Receives job creation request and validates input.
2. **DynamoDB**: Stores job configuration and status.
3. **AWS Batch**: Processes job with long-running container.
4. **GitHub API**: Accesses repositories and creates pull requests.
5. **Claude API**: Analyzes code and generates changes.
6. **Frontend**: Displays results and provides download options.

## User Experience Goals

### Simplicity
- Clear, intuitive interface for job creation and monitoring
- Minimal configuration required to get started
- Straightforward result presentation
- Easy access to patch files and Claude messages

### Transparency
- Detailed logging of all actions taken
- Clear explanation of changes made
- Visibility into Claude's reasoning process
- Complete message threads available for review

### Control
- Ability to review changes before they're applied
- Options to customize prompts
- Capability to pause or cancel jobs
- Repository limit to control costs

### Scalability
- Handle multiple repositories efficiently (up to 5 per job)
- Process large codebases without performance degradation
- Support long-running jobs (>15 minutes)

### Security
- Strict permission controls for GitHub access
- Limited scope of automated changes (only to specified repositories)
- Secure handling of service account credentials

## Key Differentiators

### AI-Powered Code Modification
Unlike traditional code analysis tools, Cody Batch uses Claude 3.7 to understand code context and generate appropriate changes, not just identify issues.

### Batch Processing
Instead of handling one repository at a time, Cody Batch can process multiple repositories in parallel, applying consistent changes across all of them.

### Long-Running Jobs
By using AWS Batch instead of Lambda, Cody Batch can handle jobs that take longer than 15 minutes, allowing for more complex code analysis and changes.

### Transparency and Explainability
By storing and displaying Claude message threads, Cody Batch provides transparency into the AI's reasoning process, helping users understand why changes were made.

### Pull Request Automation
For owned repositories, Cody Batch can automatically create pull requests, streamlining the code review and integration process.

## Target Users

### Primary: Sourcegraph Leadership
As a job application showcase, the primary "users" are Sourcegraph leaders who will evaluate the project as a demonstration of technical skills and understanding of AI coding agents.

### Secondary: Repository Maintainers
In a real-world scenario, the target users would be developers and repository maintainers who need to apply consistent changes across multiple repositories.

## Success Metrics

### For Job Application
1. **Technical Impression**: Does the project demonstrate technical excellence?
2. **Vision Alignment**: Does it align with Sourcegraph's vision for AI coding agents?
3. **Innovation**: Does it present novel applications of AI for code modification?
4. **Completeness**: Is it a production-ready, end-to-end solution?

### For the Product
1. **Processing Success Rate**: Percentage of repositories successfully processed
2. **Change Accuracy**: Quality and correctness of generated changes
3. **Time Savings**: Reduction in manual effort compared to traditional methods
4. **User Satisfaction**: Ease of use and clarity of results