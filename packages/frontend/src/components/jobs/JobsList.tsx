import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useApi } from '../../context/ApiContext';
import { JobStatus } from '../../services/api';
import styles from './JobsList.module.css';
import appStyles from '../../app/app.module.css';

export function JobsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>(undefined);
  
  const { 
    jobs, 
    jobsStatus, 
    jobsError, 
    loadJobs,
    cancelJob,
    cancelJobStatus,
    cancelJobError
  } = useApi();
  
  // Load jobs on component mount and when pagination/filter changes
  useEffect(() => {
    loadJobs(currentPage, itemsPerPage, statusFilter);
  }, [loadJobs, currentPage, itemsPerPage, statusFilter]);
  
  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value === 'all' ? undefined : value as JobStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Handle job cancellation
  const handleCancelJob = async (jobId: string) => {
    if (confirm('Are you sure you want to cancel this job?')) {
      try {
        await cancelJob(jobId);
        // Job will be updated in the list automatically due to query invalidation
      } catch (error) {
        console.error('Failed to cancel job:', error);
      }
    }
  };
  
  // Get status class for styling
  const getStatusClass = (status: JobStatus): string => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'processing':
        return styles.statusProcessing;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      case 'cancelled':
        return styles.statusCancelled;
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Loading state
  if (jobsStatus === 'loading') {
    return (
      <div className={appStyles.page}>
        <h1>Jobs</h1>
        <div className={styles.loadingContainer}>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (jobsStatus === 'error') {
    return (
      <div className={appStyles.page}>
        <h1>Jobs</h1>
        <div className={appStyles.alertDanger}>
          <p>Error loading jobs: {jobsError?.message}</p>
          <button 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            onClick={() => loadJobs(currentPage, itemsPerPage, statusFilter)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={appStyles.page}>
      <h1>Jobs</h1>
      
      <div className={styles.actionsContainer}>
        {/* Status filter */}
        <div className={styles.filterContainer}>
          <label htmlFor="statusFilter" className={appStyles.label}>
            Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter || 'all'}
            onChange={handleStatusFilterChange}
            className={appStyles.select}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {/* Create job button */}
        <Link 
          to="/jobs/create" 
          className={`${appStyles.button} ${appStyles.buttonPrimary}`}
        >
          Create New Job
        </Link>
      </div>
      
      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No jobs found.</p>
        </div>
      ) : (
        <div className={styles.jobsTable}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.jobId}>
                  <td className={styles.jobName}>
                    <Link to={`/jobs/${job.jobId}`}>{job.name}</Link>
                  </td>
                  <td>{job.type}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ 
                            width: `${job.repositoryCount > 0 
                              ? (job.completedCount / job.repositoryCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {job.completedCount}/{job.repositoryCount}
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link 
                        to={`/jobs/${job.jobId}`}
                        className={`${appStyles.button} ${appStyles.buttonSecondary}`}
                      >
                        View
                      </Link>
                      {(job.status === 'pending' || job.status === 'processing') && (
                        <button 
                          onClick={() => handleCancelJob(job.jobId)}
                          className={`${appStyles.button} ${appStyles.buttonDanger}`}
                          disabled={cancelJobStatus === 'loading'}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {/* We would add pagination controls here based on the pagination data from the API */}
    </div>
  );
}

export default JobsList;