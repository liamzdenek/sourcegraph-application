# Cody Batch User Interface Plan

## 1. Overall Structure

The UI will follow a modern, clean design with a sidebar navigation and main content area. We'll use React with Vite and CSS modules as specified in the project requirements.

### Navigation Structure

```
- Dashboard
- Repositories
- Jobs
  - Create Job
  - Job List
  - Job Details
- Settings
```

## 2. Key Screens & Components

### Dashboard

**Purpose**: Provide an overview of system status and recent activity.

**Components**:
- System status indicators (API, GitHub, Claude)
- Recent jobs summary (last 5 jobs)
- Quick stats (total jobs, success rate, repositories processed)
- Quick actions (create job, view repositories)

### Repositories Screen

**Purpose**: Browse and select repositories for processing.

**Components**:
- Repository search/filter
- Repository list with pagination
- Repository cards showing:
  - Repository name
  - Description
  - Last processed status
  - Quick action to create job for this repository

### Create Job Screen

**Purpose**: Configure and submit new jobs.

**Components**:
- Job configuration form:
  - Job name
  - Job description
  - Prompt input (with templates)
  - Repository selection (multi-select, max 5)
  - Pull request option toggle
- Prompt templates for common tasks
- Preview of selected repositories
- Submit button with validation

### Job List Screen

**Purpose**: View and manage all jobs.

**Components**:
- Job filter (by status, date, type)
- Job list with pagination
- Job cards showing:
  - Job name
  - Status with visual indicator
  - Creation date
  - Repository count
  - Completion percentage
  - Quick actions (view details, cancel)

### Job Details Screen

**Purpose**: View detailed information about a specific job.

**Components**:
- Job header with status and metadata
- Repository list with status indicators
- Repository details expandable panels:
  - Status and timestamps
  - Changes summary
  - Pull request link (if created)
  - Actions (view diff, view Claude thread)
- Job actions (cancel job if in progress)

### Diff Viewer

**Purpose**: View code changes made by Claude.

**Components**:
- Split-pane diff view
- Syntax highlighting
- Line numbers
- File navigation (if multiple files changed)

### Claude Thread Viewer

**Purpose**: View the conversation with Claude.

**Components**:
- Message thread with alternating styles for human/assistant
- View mode selector (standard, technical, simplified)
- Tool call visualization (for technical view)
- Timestamp display
- Token usage summary

## 3. User Flows

### Creating a New Job

1. User navigates to "Create Job" screen
2. User enters job name and description
3. User selects a prompt template or writes a custom prompt
4. User selects repositories (up to 5)
5. User toggles pull request option
6. User submits job
7. System validates input and creates job
8. User is redirected to job details screen

### Monitoring Job Progress

1. User navigates to "Jobs" screen
2. User finds job in list or uses filters
3. User clicks on job to view details
4. User sees real-time updates of repository processing
5. User can expand repositories to see status

### Viewing Job Results

1. User navigates to job details screen
2. User expands a completed repository
3. User clicks "View Diff" to see code changes
4. User clicks "View Claude Thread" to see conversation
5. User can toggle between different view modes for the conversation

### Cancelling a Job

1. User navigates to job details screen
2. User clicks "Cancel Job" button
3. System displays confirmation dialog
4. User confirms cancellation
5. System updates job status to cancelled

## 4. Design Considerations

### Responsive Design

- Mobile-first approach
- Breakpoints for tablet and desktop
- Collapsible sidebar for mobile
- Simplified views for small screens

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Sufficient color contrast
- Focus indicators

### Visual Design

- Clean, minimal interface
- Status color coding:
  - Pending: Blue
  - Processing: Yellow
  - Completed: Green
  - Failed: Red
  - Cancelled: Gray
- Loading states and skeletons
- Transitions and animations for state changes

## 5. Technical Implementation

### Technology Stack

- React with TypeScript
- Vite for build tooling
- CSS Modules for styling
- Tanstack Router for routing
- Tanstack Query for data fetching
- Zod for form validation

### Component Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── app.module.css
│   └── routes/
│       ├── dashboard/
│       ├── repositories/
│       ├── jobs/
│       │   ├── create/
│       │   ├── list/
│       │   └── [id]/
│       │       ├── index.tsx
│       │       ├── diff.tsx
│       │       └── claude-thread.tsx
│       └── settings/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── ...
│   └── features/
│       ├── JobForm/
│       ├── RepositoryList/
│       ├── DiffViewer/
│       └── ...
├── hooks/
│   ├── useJobs.ts
│   ├── useRepositories.ts
│   └── ...
├── services/
│   ├── api.ts
│   ├── jobService.ts
│   └── repositoryService.ts
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── ...
```

### State Management

- Use React Query for server state
- Use React Context for global UI state
- Use local state for component-specific state

### API Integration

- Create API client with fetch
- Use React Query for data fetching, caching, and mutations
- Implement polling for job status updates
- Handle authentication and error states

## 6. Implementation Phases

### Phase 1: Core Structure (Week 1)

- Set up Vite with React and TypeScript
- Configure Tanstack Router
- Create basic layout components
- Implement navigation

### Phase 2: Repository Management (Week 1-2)

- Implement repository list screen
- Create repository filtering and search
- Connect to API endpoints

### Phase 3: Job Creation (Week 2)

- Implement job creation form
- Add repository selection
- Implement form validation
- Connect to API endpoints

### Phase 4: Job Management (Week 2-3)

- Implement job list screen
- Create job filtering and search
- Implement job details screen
- Add real-time status updates

### Phase 5: Result Visualization (Week 3-4)

- Implement diff viewer
- Create Claude thread viewer
- Add different view modes for conversations
- Implement token usage visualization

### Phase 6: Polish and Testing (Week 4)

- Add loading states and error handling
- Implement responsive design
- Conduct usability testing
- Fix bugs and improve performance

## 7. Mockups

Here are text-based mockups of the key screens:

### Dashboard

```
+--------------------------------------+
| CODY BATCH                [User ▼]  |
+----------+-------------------------+
| Dashboard|  Dashboard               |
| Repos    |                          |
| Jobs     |  System Status           |
| Settings |  ✓ API    ✓ GitHub    ✓ Claude |
+----------+                          |
|          |  Recent Jobs             |
|          |  +------------------------+
|          |  | Update API calls      |
|          |  | Completed • 2/2 repos |
|          |  +------------------------+
|          |  | Fix vulnerabilities   |
|          |  | In Progress • 1/3 repos |
|          |  +------------------------+
|          |                          |
|          |  Quick Stats             |
|          |  +------+ +------+ +-----+
|          |  | 12   | | 85%  | | 8   |
|          |  | Jobs | | Rate | | Repos|
|          |  +------+ +------+ +-----+
|          |                          |
|          |  [Create New Job]        |
+----------+--------------------------+
```

### Create Job

```
+--------------------------------------+
| CODY BATCH                [User ▼]  |
+----------+-------------------------+
| Dashboard|  Create Job              |
| Repos    |                          |
| Jobs     |  Job Details             |
| Settings |  +------------------------+
+----------+  | Name:                 |
|          |  | [Update API calls    ]|
|          |  |                       |
|          |  | Description:          |
|          |  | [Update deprecated...]|
|          |  +------------------------+
|          |                          |
|          |  Prompt                  |
|          |  +------------------------+
|          |  | Template: [API Update▼]|
|          |  |                       |
|          |  | [You are an expert...]|
|          |  | [...]                 |
|          |  +------------------------+
|          |                          |
|          |  Select Repositories (0/5)|
|          |  +------------------------+
|          |  | □ repo1               |
|          |  | □ repo2               |
|          |  | □ repo3               |
|          |  +------------------------+
|          |                          |
|          |  Options                 |
|          |  +------------------------+
|          |  | ☑ Create Pull Requests|
|          |  +------------------------+
|          |                          |
|          |  [Cancel] [Create Job]   |
+----------+--------------------------+
```

### Job Details

```
+--------------------------------------+
| CODY BATCH                [User ▼]  |
+----------+-------------------------+
| Dashboard|  Job: Update API calls   |
| Repos    |                          |
| Jobs     |  Status: In Progress     |
| Settings |  Created: Mar 24, 2025   |
+----------+  Repositories: 2/3 complete |
|          |                          |
|          |  [Cancel Job]            |
|          |                          |
|          |  Repositories            |
|          |  +------------------------+
|          |  | ✓ liamzdenek/repo1   |
|          |  | Completed • Changes made |
|          |  | PR: #123              |
|          |  | [View Diff] [View Thread] |
|          |  +------------------------+
|          |  | ✓ liamzdenek/repo2   |
|          |  | Completed • No changes |
|          |  | [View Thread]         |
|          |  +------------------------+
|          |  | ⟳ liamzdenek/repo3   |
|          |  | In Progress           |
|          |  +------------------------+
|          |                          |
+----------+--------------------------+
```

### Claude Thread Viewer

```
+--------------------------------------+
| CODY BATCH                [User ▼]  |
+----------+-------------------------+
| Dashboard|  Claude Thread            |
| Repos    |                          |
| Jobs     |  View: [Standard ▼]      |
| Settings |                          |
+----------+  Token Usage: 2,732      |
|          |  Input: 1,750 • Output: 982 |
|          |                          |
|          |  +------------------------+
|          |  | Human • 12:10:00      |
|          |  | You are an expert...  |
|          |  +------------------------+
|          |  | Assistant • 12:10:30  |
|          |  | I'll update the...    |
|          |  +------------------------+
|          |  | Tool Call • 12:11:00  |
|          |  | list_files(src)       |
|          |  +------------------------+
|          |  | Tool Result • 12:11:05|
|          |  | ["api.js", "utils.js"]|
|          |  +------------------------+
|          |  | Human • 12:15:00      |
|          |  | Here's another file...|
|          |  +------------------------+
|          |                          |
|          |  [Back to Job]           |
+----------+--------------------------+
```

This UI plan provides a comprehensive roadmap for implementing the frontend of the Cody Batch application, with a focus on usability, clean design, and effective visualization of the AI-powered code analysis process.