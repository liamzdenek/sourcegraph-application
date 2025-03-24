import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Dashboard.module.css';
import appStyles from '../../app/app.module.css';
import { useApiContext } from '../../context/ApiContext';
import { formatDate } from 'shared';

const Dashboard: React.FC = () => {
  const { 
    health, 
    healthStatus, 
    jobs, 
    jobsStatus,
    refreshHealth
  } = useApiContext();

  const [showHealthDetails, setShowHealthDetails] = useState(false);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <div className={styles.actions}>
          <Link 
            to="/jobs/create" 
            className={`${appStyles.button} ${appStyles.primary}`}
          >
            Create New Job
          </Link>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>System Status</h2>
          <button 
            className={`${appStyles.button} ${appStyles.small}`}
            onClick={() => refreshHealth()}
          >
            Refresh
          </button>
        </div>
        
        <div className={styles.statusContainer}>
          {healthStatus === 'loading' && (
            <div className={styles.loading}>Loading system status...</div>
          )}
          
          {healthStatus === 'error' && (
            <div className={styles.error}>
              <p>Error loading system status</p>
              <button 
                className={`${appStyles.button} ${appStyles.small}`}
                onClick={() => refreshHealth()}
              >
                Retry
              </button>
            </div>
          )}
          
          {healthStatus === 'success' && health && (
            <>
              <div className={styles.statusSummary}>
                <div className={`${styles.statusIndicator} ${health.status === 'healthy' ? styles.healthy : styles.unhealthy}`}>
                  {health.status === 'healthy' ? '✓' : '✗'}
                </div>
                <div className={styles.statusInfo}>
                  <h3>System {health.status}</h3>
                  <p>Last checked: {formatDate(health.timestamp)}</p>
                </div>
                <button 
                  className={`${appStyles.button} ${appStyles.small} ${appStyles.text}`}
                  onClick={() => setShowHealthDetails(!showHealthDetails)}
                >
                  {showHealthDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showHealthDetails && (
                <div className={styles.statusDetails}>
                  <h3>Component Status</h3>
                  <div className={styles.statusGrid}>
                    <div className={styles.statusCard}>
                      <div className={styles.statusIcon}>
                        {health.dependencies?.dynamodb === 'healthy' ? '✓' : '✗'}
                      </div>
                      <div className={styles.statusLabel}>DynamoDB</div>
                    </div>
                    
                    <div className={styles.statusCard}>
                      <div className={styles.statusIcon}>
                        {health.dependencies?.github === 'healthy' ? '✓' : '✗'}
                      </div>
                      <div className={styles.statusLabel}>GitHub</div>
                    </div>
                    
                    <div className={styles.statusCard}>
                      <div className={styles.statusIcon}>
                        {health.dependencies?.claude === 'healthy' ? '✓' : '✗'}
                      </div>
                      <div className={styles.statusLabel}>Claude</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Jobs</h2>
          <Link 
            to="/jobs" 
            className={`${appStyles.button} ${appStyles.small} ${appStyles.text}`}
          >
            View All
          </Link>
        </div>
        
        <div className={styles.jobsContainer}>
          {jobsStatus === 'loading' && (
            <div className={styles.loading}>Loading jobs...</div>
          )}
          
          {jobsStatus === 'error' && (
            <div className={styles.error}>Error loading jobs</div>
          )}
          
          {jobsStatus === 'success' && recentJobs.length === 0 && (
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
          
          {jobsStatus === 'success' && recentJobs.length > 0 && (
            <div className={styles.jobCards}>
              {recentJobs.map(job => (
                <div key={job.jobId} className={styles.jobCard}>
                  <Link to={`/jobs/${job.jobId}`} className={styles.jobCardLink}>
                    <h3>{job.name}</h3>
                    <div className={styles.jobMeta}>
                      <span className={`${styles.jobStatus} ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                      <span className={styles.jobDate}>{formatDate(job.createdAt)}</span>
                    </div>
                    <div className={styles.jobProgress}>
                      <span>{job.completedCount}/{job.repositoryCount} repositories</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;