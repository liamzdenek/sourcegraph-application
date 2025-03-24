import { useEffect } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useApi } from '../../context/ApiContext';
import { JobStatus } from '../../services/api';
import styles from './JobDetails.module.css';
import appStyles from '../../app/app.module.css';

export function JobDetails() {
  const { jobId } = useParams({ from: '/jobs/$jobId' });
  
  const { 
    currentJob, 
    currentJobStatus, 
    currentJobError, 
    loadJobDetails,
    cancelJob,
    cancelJobStatus,
    cancelJobError
  } = useApi();
  
  // Load job details on component mount
  useEffect(() => {
    if (jobId) {
      loadJobDetails(jobId);
    }
  }, [jobId, loadJobDetails]);
  
  // Handle job cancellation
  const handleCancelJob = async () => {
    if (!jobId) return;
    
    if (confirm('Are you sure you want to cancel this job?')) {
      try {
        await cancelJob(jobId);
        // Job will be updated automatically due to query invalidation
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
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    
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
  if (currentJobStatus === 'loading') {
    return (
      <div className={appStyles.page}>
        <h1>Job Details</h1>
        <div className={styles.loadingContainer}>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (currentJobStatus === 'error') {
    return (
      <div className={appStyles.page}>
        <h1>Job Details</h1>
        <div className={appStyles.alertDanger}>
          <p>Error loading job details: {currentJobError?.message}</p>
          <button 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            onClick={() => jobId && loadJobDetails(jobId)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // No job found
  if (!currentJob) {
    return (
      <div className={appStyles.page}>
        <h1>Job Details</h1>
        <div className={appStyles.alertWarning}>
          <p>Job not found.</p>
          <Link 
            to="/jobs" 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate progress
  const progress = currentJob.repositories.length > 0
    ? (currentJob.repositories.filter(repo => repo.status === 'completed').length / currentJob.repositories.length) * 100
    : 0;
  
  return (
    <div className={appStyles.page}>
      <div className={styles.header}>
        <h1>{currentJob.name}</h1>
        <div className={styles.actions}>
          <Link 
            to="/jobs" 
            className={`${appStyles.button} ${appStyles.buttonSecondary}`}
          >
            Back to Jobs
          </Link>
          {(currentJob.status === 'pending' || currentJob.status === 'processing') && (
            <button 
              onClick={handleCancelJob}
              className={`${appStyles.button} ${appStyles.buttonDanger}`}
              disabled={cancelJobStatus === 'loading'}
            >
              Cancel Job
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.jobInfo}>
        <div className={styles.infoCard}>
          <h2>Job Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status:</span>
              <span className={`${styles.status} ${getStatusClass(currentJob.status)}`}>
                {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Type:</span>
              <span>{currentJob.type}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Created:</span>
              <span>{formatDate(currentJob.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Started:</span>
              <span>{formatDate(currentJob.startedAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Completed:</span>
              <span>{formatDate(currentJob.completedAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Create PRs:</span>
              <span>{currentJob.createPullRequests ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.infoCard}>
          <h2>Progress</h2>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {currentJob.repositories.filter(repo => repo.status === 'completed').length}/{currentJob.repositories.length} repositories
            </span>
          </div>
        </div>
        
        <div className={styles.infoCard}>
          <h2>Description</h2>
          <p className={styles.description}>
            {currentJob.description || 'No description provided.'}
          </p>
        </div>
        
        <div className={styles.infoCard}>
          <h2>Prompt</h2>
          <pre className={styles.prompt}>
            {currentJob.prompt}
          </pre>
        </div>
      </div>
      
      <div className={styles.repositoriesSection}>
        <h2>Repositories</h2>
        <div className={styles.repositoriesTable}>
          <table>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Status</th>
                <th>Changes</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentJob.repositories.map(repo => (
                <tr key={repo.name}>
                  <td>{repo.name}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(repo.status)}`}>
                      {repo.status.charAt(0).toUpperCase() + repo.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {repo.wereChangesNecessary === true ? 'Yes' : 
                     repo.wereChangesNecessary === false ? 'No' : 'N/A'}
                  </td>
                  <td>{formatDate(repo.completedAt)}</td>
                  <td>
                    <div className={styles.repoActions}>
                      {repo.status === 'completed' && (
                        <>
                          <Link 
                            to={`/jobs/${jobId}/repositories/${encodeURIComponent(repo.name)}`}
                            className={`${appStyles.button} ${appStyles.buttonSecondary}`}
                          >
                            View Details
                          </Link>
                          {repo.pullRequestUrl && (
                            <a 
                              href={repo.pullRequestUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`${appStyles.button} ${appStyles.buttonPrimary}`}
                            >
                              View PR
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;