import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './JobDetails.module.css';
import appStyles from '../../app/app.module.css';
import { useApiContext } from '../../context/ApiContext';
import { formatDate } from 'shared';

const JobDetails: React.FC = () => {
  const { 
    currentJob, 
    currentJobStatus, 
    refreshCurrentJob,
    cancelJob,
    cancelJobStatus
  } = useApiContext();

  const [activeTab, setActiveTab] = useState<'details' | 'repositories'>('details');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const handleCancelJob = () => {
    if (currentJob) {
      cancelJob(currentJob.jobId);
      setShowConfirmCancel(false);
    }
  };

  const handleRefresh = () => {
    refreshCurrentJob();
  };

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

  // Check if we're still loading
  if (currentJobStatus === 'loading') {
    return (
      <div className={styles.loading}>
        <p>Loading job details...</p>
      </div>
    );
  }

  // Check for errors
  if (currentJobStatus === 'error') {
    return (
      <div className={styles.error}>
        <p>Error loading job details</p>
        <button
          className={`${appStyles.button} ${appStyles.small}`}
          onClick={handleRefresh}
        >
          Retry
        </button>
      </div>
    );
  }

  // Check if job data is missing even though the request completed
  if (currentJobStatus === 'success' && !currentJob) {
    console.error('Job details request succeeded but returned no data');
    return (
      <div className={styles.notFound}>
        <p>Job details could not be loaded. The job may not exist.</p>
        <div className={styles.actions}>
          <button
            className={`${appStyles.button} ${appStyles.secondary}`}
            onClick={handleRefresh}
          >
            Retry
          </button>
          <Link
            to="/jobs"
            className={`${appStyles.button} ${appStyles.primary}`}
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Final check for undefined job (fallback)
  if (!currentJob) {
    return (
      <div className={styles.notFound}>
        <p>Job not found</p>
        <Link
          to="/jobs"
          className={`${appStyles.button} ${appStyles.primary}`}
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  const progress = currentJob.repositories.length > 0 
    ? (currentJob.repositories.filter(repo => repo.status === 'completed').length / currentJob.repositories.length) * 100 
    : 0;

  return (
    <div className={styles.jobDetails}>
      <div className={styles.header}>
        <h1>{currentJob.name}</h1>
        <div className={styles.actions}>
          <button 
            className={`${appStyles.button} ${appStyles.secondary}`}
            onClick={handleRefresh}
          >
            Refresh
          </button>
          {(currentJob.status === 'pending' || currentJob.status === 'in-progress') && (
            showConfirmCancel ? (
              <div className={styles.confirmCancel}>
                <span>Cancel job?</span>
                <button 
                  className={`${appStyles.button} ${appStyles.small} ${appStyles.danger}`}
                  onClick={handleCancelJob}
                  disabled={cancelJobStatus === 'loading'}
                >
                  Yes
                </button>
                <button 
                  className={`${appStyles.button} ${appStyles.small}`}
                  onClick={() => setShowConfirmCancel(false)}
                >
                  No
                </button>
              </div>
            ) : (
              <button 
                className={`${appStyles.button} ${appStyles.danger}`}
                onClick={() => setShowConfirmCancel(true)}
              >
                Cancel Job
              </button>
            )
          )}
          <Link 
            to="/jobs" 
            className={`${appStyles.button} ${appStyles.text}`}
          >
            Back to Jobs
          </Link>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <div className={styles.statusLabel}>Status:</div>
          <div className={styles.statusValue}>
            <span className={`${styles.status} ${getStatusClass(currentJob.status)}`}>
              {currentJob.status}
            </span>
          </div>
        </div>
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          ></div>
          <span className={styles.progressText}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'repositories' ? styles.active : ''}`}
          onClick={() => setActiveTab('repositories')}
        >
          Repositories
        </button>
      </div>

      {activeTab === 'details' && (
        <div className={styles.detailsTab}>
          <div className={styles.infoGrid}>
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

          <div className={styles.section}>
            <h2>Progress</h2>
            <div className={styles.progressInfo}>
              <div className={styles.progressStats}>
                <span className={styles.progressLabel}>Repositories:</span>
                <span className={styles.progressValue}>
                  {currentJob.repositories.filter(repo => repo.status === 'completed').length}/{currentJob.repositories.length} repositories
                </span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Description</h2>
            <p className={styles.description}>
              {currentJob.description || 'No description provided.'}
            </p>
          </div>

          <div className={styles.section}>
            <h2>Prompt</h2>
            <pre className={styles.prompt}>
              {currentJob.prompt || 'No prompt provided.'}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'repositories' && (
        <div className={styles.repositoriesTab}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
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
                          <Link 
                            to={`/jobs/${currentJob.jobId}/repositories/${encodeURIComponent(repo.name)}`}
                            className={`${appStyles.button} ${appStyles.small}`}
                          >
                            View Details
                          </Link>
                        )}
                        {repo.pullRequestUrl && (
                          <a 
                            href={repo.pullRequestUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`${appStyles.button} ${appStyles.small} ${appStyles.secondary}`}
                          >
                            View PR
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;