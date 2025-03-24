import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useApi } from '../../context/ApiContext';
import styles from './RepositoriesList.module.css';
import appStyles from '../../app/app.module.css';

export function RepositoriesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { 
    repositories, 
    repositoriesStatus, 
    repositoriesError, 
    loadRepositories 
  } = useApi();
  
  // Load repositories on component mount and when search/pagination changes
  useEffect(() => {
    loadRepositories(currentPage, itemsPerPage, searchTerm || undefined);
  }, [loadRepositories, currentPage, itemsPerPage, searchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRepositories(currentPage, itemsPerPage, searchTerm || undefined);
  };
  
  // Loading state
  if (repositoriesStatus === 'loading') {
    return (
      <div className={appStyles.page}>
        <h1>Repositories</h1>
        <div className={styles.loadingContainer}>
          <p>Loading repositories...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (repositoriesStatus === 'error') {
    return (
      <div className={appStyles.page}>
        <h1>Repositories</h1>
        <div className={appStyles.alertDanger}>
          <p>Error loading repositories: {repositoriesError?.message}</p>
          <button 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            onClick={() => loadRepositories(currentPage, itemsPerPage, searchTerm || undefined)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={appStyles.page}>
      <h1>Repositories</h1>
      
      {/* Search form */}
      <div className={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={appStyles.input}
          />
          <button 
            type="submit" 
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Repositories list */}
      {repositories.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No repositories found.</p>
        </div>
      ) : (
        <div className={styles.repositoriesList}>
          {repositories.map(repo => (
            <div key={repo.id} className={styles.repositoryCard}>
              <h2 className={styles.repositoryName}>{repo.name}</h2>
              <p className={styles.repositoryDescription}>
                {repo.description || 'No description available'}
              </p>
              <div className={styles.repositoryActions}>
                <a 
                  href={repo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${appStyles.button} ${appStyles.buttonSecondary}`}
                >
                  View on GitHub
                </a>
                <Link 
                  to="/jobs/create" 
                  search={{ repository: repo.name }}
                  className={`${appStyles.button} ${appStyles.buttonPrimary}`}
                >
                  Create Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {/* We would add pagination controls here based on the pagination data from the API */}
    </div>
  );
}

export default RepositoriesList;