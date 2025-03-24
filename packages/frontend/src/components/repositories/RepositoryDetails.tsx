import React, { useState, useEffect } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import styles from './RepositoryDetails.module.css';
import appStyles from '../../app/app.module.css';
import { useApiContext } from '../../context/ApiContext';
import { formatDate } from 'shared';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const RepositoryDetails: React.FC = () => {
  // Get the job ID and repository name from the route parameters
  const { jobId, repoName } = useParams({ from: '/jobs/$jobId/repositories/$repoName' });
  
  const { 
    currentRepository, 
    currentRepositoryStatus, 
    currentDiff,
    currentDiffStatus,
    currentClaudeThread,
    currentClaudeThreadStatus,
    loadRepositoryResult,
    loadRepositoryDiff,
    loadClaudeThread
  } = useApiContext();

  const [activeTab, setActiveTab] = useState<'changes' | 'conversation' | 'logs'>('changes');
  const [showDiff, setShowDiff] = useState(false);

  // Load repository details when the component mounts or when jobId/repoName changes
  useEffect(() => {
    console.log(`Loading repository details for job ${jobId}, repository ${repoName}`);
    if (jobId && repoName) {
      loadRepositoryResult(jobId, repoName);
    }
  }, [jobId, repoName, loadRepositoryResult]);

  const handleLoadDiff = () => {
    if (jobId && repoName) {
      loadRepositoryDiff(jobId, repoName);
      setShowDiff(true);
    }
  };

  const handleLoadConversation = (view: 'standard' | 'technical' | 'simplified' = 'standard') => {
    if (jobId && repoName) {
      loadClaudeThread(jobId, repoName, view);
    }
  };

  if (currentRepositoryStatus === 'loading') {
    return (
      <div className={styles.loading}>
        <p>Loading repository details...</p>
      </div>
    );
  }

  if (currentRepositoryStatus === 'error') {
    return (
      <div className={styles.error}>
        <p>Error loading repository details</p>
        <Link 
          to="/jobs" 
          className={`${appStyles.button} ${appStyles.primary}`}
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  if (!currentRepository) {
    return (
      <div className={styles.notFound}>
        <p>Repository not found</p>
        <Link 
          to="/jobs" 
          className={`${appStyles.button} ${appStyles.primary}`}
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.repositoryDetails}>
      <div className={styles.header}>
        <h1>{currentRepository.repositoryName}</h1>
        <div className={styles.actions}>
          <Link 
            to={`/jobs/${currentRepository.jobId}`}
            className={`${appStyles.button} ${appStyles.text}`}
          >
            Back to Job
          </Link>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Status:</span>
          <span>{currentRepository.status || 'N/A'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Changes Necessary:</span>
          <span>{currentRepository.wereChangesNecessary ? 'Yes' : 'No'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Started:</span>
          <span>{formatDate(currentRepository.startedAt || null)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Completed:</span>
          <span>{formatDate(currentRepository.completedAt || null)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Pull Request:</span>
          <span>
            {currentRepository.pullRequestUrl ? (
              <a 
                href={currentRepository.pullRequestUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                View PR
              </a>
            ) : (
              'N/A'
            )}
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'changes' ? styles.active : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'conversation' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('conversation');
            if (!currentClaudeThread) {
              handleLoadConversation();
            }
          }}
        >
          Claude Conversation
        </button>
        {currentRepository.logs && currentRepository.logs.length > 0 && (
          <button 
            className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        )}
      </div>

      {activeTab === 'changes' && (
        <div className={styles.changesTab}>
          <div className={styles.changesHeader}>
            <h2>File Changes</h2>
            {!showDiff && (
              <button 
                className={`${appStyles.button} ${appStyles.small}`}
                onClick={handleLoadDiff}
              >
                View Full Diff
              </button>
            )}
          </div>
          
          {showDiff ? (
            <div className={styles.diffContainer}>
              {currentDiffStatus === 'loading' && (
                <div className={styles.loading}>Loading diff...</div>
              )}
              
              {currentDiffStatus === 'error' && (
                <div className={styles.error}>Error loading diff</div>
              )}
              
              {currentDiffStatus === 'success' && currentDiff && (
                <SyntaxHighlighter 
                  language="diff" 
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  wrapLines={true}
                  className={styles.diffHighlighter}
                >
                  {currentDiff}
                </SyntaxHighlighter>
              )}
            </div>
          ) : (
            <div className={styles.fileChanges}>
              {currentRepository.changes && currentRepository.changes.length === 0 ? (
                <p>No changes were made to this repository.</p>
              ) : currentRepository.changes ? (
                <ul className={styles.fileList}>
                  {currentRepository.changes.map((change, index) => (
                    <li key={index} className={styles.fileItem}>
                      <div className={styles.fileName}>{change.file}</div>
                      <SyntaxHighlighter 
                        language="diff" 
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        wrapLines={true}
                        className={styles.diffHighlighter}
                      >
                        {change.diff}
                      </SyntaxHighlighter>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No changes information available.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'conversation' && (
        <div className={styles.conversationTab}>
          <div className={styles.conversationHeader}>
            <h2>Claude Conversation</h2>
            <div className={styles.viewOptions}>
              <button 
                className={`${appStyles.button} ${appStyles.small}`}
                onClick={() => handleLoadConversation('standard')}
              >
                Standard View
              </button>
              <button 
                className={`${appStyles.button} ${appStyles.small}`}
                onClick={() => handleLoadConversation('technical')}
              >
                Technical View
              </button>
              <button 
                className={`${appStyles.button} ${appStyles.small}`}
                onClick={() => handleLoadConversation('simplified')}
              >
                Simplified View
              </button>
            </div>
          </div>
          
          {currentClaudeThreadStatus === 'loading' && (
            <div className={styles.loading}>Loading conversation...</div>
          )}
          
          {currentClaudeThreadStatus === 'error' && (
            <div className={styles.error}>Error loading conversation</div>
          )}
          
          {currentClaudeThreadStatus === 'success' && currentClaudeThread && (
            <div className={styles.conversation}>
              <div className={styles.messages}>
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
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.messageContent}>
                      {typeof message.content === 'string' ? (
                        <div className={styles.messageText}>{message.content}</div>
                      ) : (
                        <div className={styles.messageTool}>
                          <pre>{JSON.stringify(message.content, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {currentClaudeThread.tokenUsage && (
                <div className={styles.tokenUsage}>
                  <h3>Token Usage</h3>
                  <div className={styles.tokenStats}>
                    <div>Input: {currentClaudeThread.tokenUsage.input}</div>
                    <div>Output: {currentClaudeThread.tokenUsage.output}</div>
                    <div>Total: {currentClaudeThread.tokenUsage.total}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && currentRepository.logs && (
        <div className={styles.logsTab}>
          <h2>Processing Logs</h2>
          
          {currentRepository.logs.length > 0 ? (
            <div className={styles.logs}>
                {currentRepository.logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${styles.logEntry} ${styles[log.level.toLowerCase()]}`}
                  >
                    <span className={styles.logTime}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
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
  );
};

export default RepositoryDetails;