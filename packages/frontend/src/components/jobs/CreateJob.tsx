import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import styles from './CreateJob.module.css';
import appStyles from '../../app/app.module.css';
import { useApiContext } from '../../context/ApiContext';
import { CreateJobRequest } from 'shared';

const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const { 
    repositories, 
    repositoriesStatus, 
    loadRepositories,
    createJob,
    createJobStatus,
    createJobError
  } = useApiContext();

  // Form state
  const [formData, setFormData] = useState<CreateJobRequest>({
    name: '',
    description: '',
    type: 'code-pattern-update',
    prompt: '',
    repositories: [],
    createPullRequests: true,
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Selected repositories
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  // Filter state
  const [filter, setFilter] = useState('');

  // Load repositories on mount
  React.useEffect(() => {
    loadRepositories(1, 100, filter);
  }, [loadRepositories, filter]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle repository selection
  const handleRepoSelection = (repoName: string) => {
    setSelectedRepos(prev => {
      if (prev.includes(repoName)) {
        return prev.filter(name => name !== repoName);
      } else {
        return [...prev, repoName];
      }
    });
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      repositories: selectedRepos.includes(repoName) 
        ? prev.repositories.filter(name => name !== repoName)
        : [...prev.repositories, repoName]
    }));
    
    // Clear error when repositories are selected
    if (errors.repositories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.repositories;
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required';
    }
    
    if (formData.type && !formData.type.trim()) {
      newErrors.type = 'Job type is required';
    }
    
    if (formData.prompt && !formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }
    
    if (formData.repositories.length === 0) {
      newErrors.repositories = 'At least one repository must be selected';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const result = await createJob(formData);
      navigate({ to: '/jobs/$jobId', params: { jobId: result.jobId } });
    } catch (error) {
      console.error('Error creating job:', error);
      setErrors({
        submit: 'Failed to create job. Please try again.'
      });
    }
  };

  return (
    <div className={styles.createJob}>
      <div className={styles.header}>
        <h1>Create New Job</h1>
        <Link 
          to="/jobs" 
          className={`${appStyles.button} ${appStyles.text}`}
        >
          Cancel
        </Link>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2>Job Details</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="name">Job Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? styles.error : ''}
            />
            {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="type">Job Type *</label>
            <select 
              id="type" 
              name="type" 
              value={formData.type || ''}
              onChange={handleInputChange}
              className={errors.type ? styles.error : ''}
            >
              <option value="code-pattern-update">Code Pattern Update</option>
              <option value="security-fix">Security Fix</option>
              <option value="dependency-update">Dependency Update</option>
              <option value="code-review">Code Review</option>
              <option value="custom">Custom</option>
            </select>
            {errors.type && <div className={styles.errorMessage}>{errors.type}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="prompt">Prompt *</label>
            <textarea 
              id="prompt" 
              name="prompt" 
              value={formData.prompt || ''}
              onChange={handleInputChange}
              rows={6}
              className={errors.prompt ? styles.error : ''}
              placeholder="Describe what you want Claude to do with the selected repositories..."
            />
            {errors.prompt && <div className={styles.errorMessage}>{errors.prompt}</div>}
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h2>Repositories</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="repositoryFilter">Filter Repositories</label>
            <input 
              type="text" 
              id="repositoryFilter" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name..."
            />
          </div>
          
          <div className={styles.repositoriesContainer}>
            {repositoriesStatus === 'loading' && (
              <div className={styles.loading}>Loading repositories...</div>
            )}
            
            {repositoriesStatus === 'error' && (
              <div className={styles.error}>Error loading repositories</div>
            )}
            
            {repositoriesStatus === 'success' && repositories.length === 0 && (
              <div className={styles.empty}>No repositories found</div>
            )}
            
            {repositoriesStatus === 'success' && repositories.length > 0 && (
              <div className={styles.repositories}>
                {errors.repositories && (
                  <div className={styles.errorMessage}>{errors.repositories}</div>
                )}
                
                {repositories.map(repo => (
                  <div 
                    key={repo.id} 
                    className={`${styles.repository} ${
                      selectedRepos.includes(repo.name) ? styles.selected : ''
                    }`}
                    onClick={() => handleRepoSelection(repo.name)}
                  >
                    <div className={styles.checkbox}>
                      <input 
                        type="checkbox" 
                        checked={selectedRepos.includes(repo.name)}
                        onChange={() => {}} // Handled by the div click
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className={styles.repoInfo}>
                      <div className={styles.repoName}>{repo.name}</div>
                      <div className={styles.repoDescription}>{repo.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h2>Options</h2>
          
          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="createPullRequests" 
                name="createPullRequests" 
                checked={formData.createPullRequests || false}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="createPullRequests">Create Pull Requests</label>
            </div>
            <div className={styles.helpText}>
              If checked, Claude will create pull requests for any changes it makes.
            </div>
          </div>
        </div>
        
        <div className={styles.formActions}>
          {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}
          
          <button 
            type="submit" 
            className={`${appStyles.button} ${appStyles.primary}`}
            disabled={createJobStatus === 'loading'}
          >
            {createJobStatus === 'loading' ? 'Creating...' : 'Create Job'}
          </button>
          
          <Link 
            to="/jobs" 
            className={`${appStyles.button} ${appStyles.text}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;