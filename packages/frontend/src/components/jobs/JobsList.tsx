import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './JobsList.module.css';
import appStyles from '../../app/app.module.css';
import { useApiContext } from '../../context/ApiContext';
import { formatDate } from 'shared';

const JobsList: React.FC = () => {
  const { 
    jobs, 
    jobsStatus, 
    refreshJobs,
    cancelJob,
    cancelJobStatus
  } = useApiContext();

  const [sortBy, setSortBy] = useState<'createdAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState<string | null>(null);

  const handleSort = (field: 'createdAt' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJob(jobId);
    setShowConfirmCancel(null);
  };

  const sortedJobs = jobs ? [...jobs].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return sortOrder === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return sortOrder === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
  }) : [];

  const filteredJobs = statusFilter
    ? sortedJobs.filter(job => job.status === statusFilter)
    : sortedJobs;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'in-progress':
      case 'processing':
        return styles.statusProcessing;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  return (
    <div className={styles.jobsList}>
      <div className={styles.header}>
        <h1>Jobs</h1>
        <div className={styles.actions}>
          <Link 
            to="/jobs/create" 
            className={`${appStyles.button} ${appStyles.primary}`}
          >
            Create New Job
          </Link>
          <button 
            className={`${appStyles.button} ${appStyles.secondary}`}
            onClick={() => refreshJobs()}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span>Status:</span>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === null ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter(null)}
          >
            All
          </button>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === 'pending' ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === 'in-progress' ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter('in-progress')}
          >
            In Progress
          </button>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === 'completed' ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === 'failed' ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter('failed')}
          >
            Failed
          </button>
          <button 
            className={`${appStyles.button} ${appStyles.small} ${statusFilter === 'cancelled' ? appStyles.active : ''}`}
            onClick={() => handleStatusFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {jobsStatus === 'loading' && (
          <div className={styles.loading}>Loading jobs...</div>
        )}
        
        {jobsStatus === 'error' && (
          <div className={styles.error}>
            <p>Error loading jobs</p>
            <button 
              className={`${appStyles.button} ${appStyles.small}`}
              onClick={() => refreshJobs()}
            >
              Retry
            </button>
          </div>
        )}
        
        {jobsStatus === 'success' && filteredJobs.length === 0 && (
          <div className={styles.empty}>
            <p>No jobs found</p>
            <Link 
              to="/jobs/create" 
              className={`${appStyles.button} ${appStyles.primary}`}
            >
              Create Your First Job
            </Link>
          </div>
        )}
        
        {jobsStatus === 'success' && filteredJobs.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th 
                  className={styles.sortable}
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortBy === 'status' && (
                    <span className={styles.sortIcon}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className={styles.sortable}
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  {sortBy === 'createdAt' && (
                    <span className={styles.sortIcon}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.jobId}>
                  <td>
                    <Link to={`/jobs/${job.jobId}`}>{job.name}</Link>
                  </td>
                  <td>{job.type}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>
                    <div className={styles.progressContainer}>
                      <div 
                        className={styles.progressBar}
                        style={{
                          width: `${job.repositoryCount > 0 
                            ? (job.completedCount / job.repositoryCount) * 100 
                            : 0}%`
                        }}
                      ></div>
                      <span className={styles.progressText}>
                        {job.completedCount}/{job.repositoryCount}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Link 
                        to={`/jobs/${job.jobId}`}
                        className={`${appStyles.button} ${appStyles.small}`}
                      >
                        View
                      </Link>
                      {(job.status === 'pending' || job.status === 'in-progress') && (
                        showConfirmCancel === job.jobId ? (
                          <div className={styles.confirmCancel}>
                            <span>Cancel?</span>
                            <button 
                              className={`${appStyles.button} ${appStyles.small} ${appStyles.danger}`}
                              onClick={() => handleCancelJob(job.jobId)}
                              disabled={cancelJobStatus === 'loading'}
                            >
                              Yes
                            </button>
                            <button 
                              className={`${appStyles.button} ${appStyles.small}`}
                              onClick={() => setShowConfirmCancel(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            className={`${appStyles.button} ${appStyles.small} ${appStyles.danger}`}
                            onClick={() => setShowConfirmCancel(job.jobId)}
                          >
                            Cancel
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default JobsList;