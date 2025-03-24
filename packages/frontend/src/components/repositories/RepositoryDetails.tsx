import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useApi } from '../../context/ApiContext';
import styles from './RepositoryDetails.module.css';
import appStyles from '../../app/app.module.css';

export function RepositoryDetails() {
  const { jobId, repoName } = useParams({ from: '/jobs/$jobId/repositories/$repoName' });
  const decodedRepoName = decodeURIComponent(repoName);
  
  const [activeTab, setActiveTab] = useState<'changes' | 'conversation' | 'logs'>('changes');
  const [viewMode, setViewMode] = useState<'standard' | 'technical' | 'simplified'>('standard');
  
  const { 
    currentJob,
    currentJobStatus,
    currentJobError,
    loadJobDetails,
    currentRepository,
    currentRepositoryStatus,
    currentRepositoryError,
    loadRepositoryResult,
    currentDiff,
    currentDiffStatus,
    currentDiffError,
    loadRepositoryDiff,
    currentClaudeThread,
    currentClaudeThreadStatus,
    currentClaudeThreadError,
    loadClaudeThread
  } = useApi();
  
  // Load job details and repository result on component mount
  useEffect(() => {
    if (jobId) {
      loadJobDetails(jobId);
    }
    
    if (jobId && repoName) {
      loadRepositoryResult(jobId, decodedRepoName);
    }
  }, [jobId, repoName, decodedRepoName, loadJobDetails, loadRepositoryResult]);
  
  // Load diff when tab is changes
  useEffect(() => {
    if (jobId && repoName && activeTab === 'changes') {
      loadRepositoryDiff(jobId, decodedRepoName);
    }
  }, [jobId, repoName, decodedRepoName, activeTab, loadRepositoryDiff]);
  
  // Load Claude thread when tab is conversation
  useEffect(() => {
    if (jobId && repoName && activeTab === 'conversation') {
      loadClaudeThread(jobId, decodedRepoName, viewMode);
    }
  }, [jobId, repoName, decodedRepoName, activeTab, viewMode, loadClaudeThread]);
  
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
  if (currentRepositoryStatus === 'loading' || currentJobStatus === 'loading') {
    return (
      <div className={appStyles.page}>
        <h1>Repository Details</h1>
        <div className={styles.loadingContainer}>
          <p>Loading repository details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (currentRepositoryStatus === 'error' || currentJobStatus === 'error') {
    return (
      <div className={appStyles.page}>
        <h1>Repository Details</h1>
        <div className={appStyles.alertDanger}>
          <p>
            Error loading repository details: 
            {currentRepositoryError?.message || currentJobError?.message}
          </p>
          <button 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            onClick={() => {
              if (jobId) loadJobDetails(jobId);
              if (jobId && repoName) loadRepositoryResult(jobId, decodedRepoName);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // No repository found
  if (!currentRepository || !currentJob) {
    return (
      <div className={appStyles.page}>
        <h1>Repository Details</h1>
        <div className={appStyles.alertWarning}>
          <p>Repository not found.</p>
          <Link 
            to={`/jobs/${jobId}`} 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
          >
            Back to Job
          </Link>
        </div>
      </div>
    );
  }
  
  // Get repository status from job
  const repoStatus = currentJob.repositories.find(repo => repo.name === decodedRepoName);
  
  return (
    <div className={appStyles.page}>
      <div className={styles.header}>
        <h1>{decodedRepoName}</h1>
        <div className={styles.actions}>
          <Link 
            to={`/jobs/${jobId}`} 
            className={`${appStyles.button} ${appStyles.buttonSecondary}`}
          >
            Back to Job
          </Link>
          {repoStatus?.pullRequestUrl && (
            <a 
              href={repoStatus.pullRequestUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            >
              View Pull Request
            </a>
          )}
        </div>
      </div>
      
      <div className={styles.infoCard}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status:</span>
            <span>{currentRepository.status}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Changes Made:</span>
            <span>{currentRepository.wereChangesNecessary ? 'Yes' : 'No'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Started:</span>
            <span>{formatDate(currentRepository.startedAt)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Completed:</span>
            <span>{formatDate(currentRepository.completedAt)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Files Changed:</span>
            <span>{currentRepository.changes.length}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Pull Request:</span>
            <span>
              {currentRepository.pullRequestUrl ? (
                <a 
                  href={currentRepository.pullRequestUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View PR
                </a>
              ) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'changes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'conversation' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Claude Conversation
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'logs' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'changes' && (
          <div className={styles.changesTab}>
            <h2>Changes</h2>
            {currentDiffStatus === 'loading' ? (
              <p>Loading diff...</p>
            ) : currentDiffStatus === 'error' ? (
              <div className={appStyles.alertDanger}>
                <p>Error loading diff: {currentDiffError?.message}</p>
                <button 
                  className={`${appStyles.button} ${appStyles.buttonPrimary}`}
                  onClick={() => {
                    if (jobId && repoName) loadRepositoryDiff(jobId, decodedRepoName);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : currentDiff ? (
              <pre className={styles.diff}>{currentDiff}</pre>
            ) : (
              <p>No changes were made to this repository.</p>
            )}
          </div>
        )}
        
        {activeTab === 'conversation' && (
          <div className={styles.conversationTab}>
            <div className={styles.conversationHeader}>
              <h2>Claude Conversation</h2>
              <div className={styles.viewModeSelector}>
                <label htmlFor="viewMode">View Mode:</label>
                <select 
                  id="viewMode" 
                  value={viewMode} 
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className={appStyles.select}
                >
                  <option value="standard">Standard</option>
                  <option value="technical">Technical</option>
                  <option value="simplified">Simplified</option>
                </select>
              </div>
            </div>
            
            {currentClaudeThreadStatus === 'loading' ? (
              <p>Loading conversation...</p>
            ) : currentClaudeThreadStatus === 'error' ? (
              <div className={appStyles.alertDanger}>
                <p>Error loading conversation: {currentClaudeThreadError?.message}</p>
                <button 
                  className={`${appStyles.button} ${appStyles.buttonPrimary}`}
                  onClick={() => {
                    if (jobId && repoName) loadClaudeThread(jobId, decodedRepoName, viewMode);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : currentClaudeThread ? (
              <div className={styles.conversation}>
                {currentClaudeThread.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`${styles.message} ${
                      message.role === 'human' ? styles.humanMessage : styles.assistantMessage
                    }`}
                  >
                    <div className={styles.messageHeader}>
                      <span className={styles.messageRole}>
                        {message.role === 'human' ? 'Human' : 'Claude'}
                      </span>
                      <span className={styles.messageTime}>
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <div className={styles.messageContent}>
                      {typeof message.content === 'string' ? (
                        <pre>{message.content}</pre>
                      ) : (
                        <pre>{JSON.stringify(message.content, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className={styles.tokenUsage}>
                  <h3>Token Usage</h3>
                  <div className={styles.tokenUsageGrid}>
                    <div>Input: {currentClaudeThread.tokenUsage.input}</div>
                    <div>Output: {currentClaudeThread.tokenUsage.output}</div>
                    <div>Total: {currentClaudeThread.tokenUsage.total}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No conversation data available.</p>
            )}
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className={styles.logsTab}>
            <h2>Logs</h2>
            {currentRepository.logs.length > 0 ? (
              <div className={styles.logs}>
                {currentRepository.logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${styles.logEntry} ${
                      log.level === 'ERROR' ? styles.errorLog :
                      log.level === 'WARN' ? styles.warnLog :
                      styles.infoLog
                    }`}
                  >
                    <span className={styles.logTime}>{formatDate(log.timestamp)}</span>
                    <span className={styles.logLevel}>{log.level}</span>
                    <span className={styles.logMessage}>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No logs available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RepositoryDetails;