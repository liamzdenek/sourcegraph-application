import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Dashboard.module.css';
import appStyles from '../../app/app.module.css';
import { useApi } from '../../context/ApiContext';
import { JobStatus } from '../../services/api';

export function Dashboard() {
  const { 
    health, 
    healthStatus, 
    refreshHealth,
    jobs,
    jobsStatus,
    jobsError,
    loadJobs
  } = useApi();

  // Load data on component mount
  useEffect(() => {
    refreshHealth();
    loadJobs(1, 3); // Load first 3 jobs for the dashboard
  }, [refreshHealth, loadJobs]);

  // Count jobs by status
  const jobCounts = {
    total: jobs.length,
    pending: jobs.filter(job => job.status === 'pending').length,
    processing: jobs.filter(job => job.status === 'processing').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length,
  };

  // Map job status to CSS class
  const getStatusClass = (status: JobStatus): string => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'processing':
        return styles.inProgress;
      case 'completed':
        return styles.completed;
      case 'failed':
        return styles.failed;
      case 'cancelled':
        return styles.cancelled;
      default:
        return '';
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (jobsStatus === 'loading') {
    return (
      <div className={appStyles.page}>
        <h1>Dashboard</h1>
        <div className={styles.loadingContainer}>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (jobsStatus === 'error') {
    return (
      <div className={appStyles.page}>
        <h1>Dashboard</h1>
        <div className={styles.errorContainer}>
          <p>Error loading dashboard data: {jobsError?.message}</p>
          <button 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            onClick={() => {
              refreshHealth();
              loadJobs(1, 3);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={appStyles.page}>
      <h1>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{jobCounts.total}</div>
          <div className={styles.statLabel}>Total Jobs</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statValue}>{jobCounts.completed}</div>
          <div className={styles.statLabel}>Completed Jobs</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statValue}>{jobCounts.processing}</div>
          <div className={styles.statLabel}>Active Jobs</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {jobCounts.total > 0 
              ? Math.round((jobCounts.completed / jobCounts.total) * 100) 
              : 0}%
          </div>
          <div className={styles.statLabel}>Success Rate</div>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2>Recent Jobs</h2>
        {jobs.length === 0 ? (
          <p>No jobs found. Create a new job to get started.</p>
        ) : (
          <div className={styles.jobList}>
            {jobs.map(job => (
              <div key={job.jobId} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <h3>{job.name}</h3>
                  <div className={`${styles.jobStatus} ${getStatusClass(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </div>
                </div>
                <div className={styles.jobMeta}>
                  <span>{job.completedCount}/{job.repositoryCount} repositories</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.section}>
        <h2>System Status</h2>
        {healthStatus === 'success' && health ? (
          <div className={styles.statusGrid}>
            <div className={styles.statusCard}>
              <div className={styles.statusIcon}>
                {health.dependencies.dynamodb === 'healthy' ? '✓' : '✗'}
              </div>
              <div className={styles.statusLabel}>DynamoDB</div>
            </div>
            
            <div className={styles.statusCard}>
              <div className={styles.statusIcon}>
                {health.dependencies.github === 'healthy' ? '✓' : '✗'}
              </div>
              <div className={styles.statusLabel}>GitHub</div>
            </div>
            
            <div className={styles.statusCard}>
              <div className={styles.statusIcon}>
                {health.dependencies.claude === 'healthy' ? '✓' : '✗'}
              </div>
              <div className={styles.statusLabel}>Claude</div>
            </div>
          </div>
        ) : (
          <p>Loading system status...</p>
        )}
      </div>
      
      <div className={styles.createJobButton}>
        <Link 
          to="/jobs/create" 
          className={`${appStyles.button} ${appStyles.buttonPrimary}`}
        >
          Create New Job
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;