import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useApi } from '../../context/ApiContext';
import { CreateJobRequest } from '../../services/api';
import styles from './CreateJob.module.css';
import appStyles from '../../app/app.module.css';

export function CreateJob() {
  const navigate = useNavigate();
  
  const { 
    repositories, 
    repositoriesStatus, 
    repositoriesError, 
    loadRepositories,
    createJob,
    createJobStatus,
    createJobError
  } = useApi();
  
  // Form state
  const [formData, setFormData] = useState<CreateJobRequest>({
    name: '',
    description: '',
    type: 'code-pattern-update',
    prompt: '',
    repositories: [],
    createPullRequests: true,
  });
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load repositories on component mount
  useEffect(() => {
    loadRepositories(1, 100); // Load up to 100 repositories
  }, [loadRepositories]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
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
      [name]: checked,
    }));
  };
  
  // Handle repository selection
  const handleRepositoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      repositories: selectedOptions,
    }));
    
    // Clear error for repositories
    if (errors.repositories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.repositories;
        return newErrors;
      });
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Job name is required';
    }
    
    if (!formData.type.trim()) {
      newErrors.type = 'Job type is required';
    }
    
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }
    
    if (formData.repositories.length === 0) {
      newErrors.repositories = 'At least one repository must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const job = await createJob(formData);
      navigate({ to: `/jobs/${job.jobId}` });
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };
  
  return (
    <div className={appStyles.page}>
      <h1>Create Job</h1>
      
      {createJobError && (
        <div className={appStyles.alertDanger}>
          <p>Error creating job: {createJobError.message}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={appStyles.form}>
        {/* Job Name */}
        <div className={appStyles.formGroup}>
          <label htmlFor="name" className={appStyles.label}>
            Job Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={appStyles.input}
            placeholder="Enter job name"
          />
          {errors.name && <div className={appStyles.error}>{errors.name}</div>}
        </div>
        
        {/* Job Description */}
        <div className={appStyles.formGroup}>
          <label htmlFor="description" className={appStyles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={appStyles.textarea}
            placeholder="Enter job description"
          />
        </div>
        
        {/* Job Type */}
        <div className={appStyles.formGroup}>
          <label htmlFor="type" className={appStyles.label}>
            Job Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={appStyles.select}
          >
            <option value="code-pattern-update">Code Pattern Update</option>
            <option value="vulnerability-fix">Vulnerability Fix</option>
            <option value="code-cleanup">Code Cleanup</option>
            <option value="feature-implementation">Feature Implementation</option>
          </select>
          {errors.type && <div className={appStyles.error}>{errors.type}</div>}
        </div>
        
        {/* Prompt */}
        <div className={appStyles.formGroup}>
          <label htmlFor="prompt" className={appStyles.label}>
            Prompt *
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            className={appStyles.textarea}
            placeholder="Enter instructions for Claude"
            rows={10}
          />
          {errors.prompt && <div className={appStyles.error}>{errors.prompt}</div>}
          <div className={styles.promptHelp}>
            <p>
              Provide clear instructions for Claude to perform the task. Be specific about what changes should be made.
            </p>
            <p>
              Example: &quot;You are an expert software engineer. Your task is to update all instances of deprecated API calls to use the new format. Replace all occurrences of &apos;oldFunction(param)&apos; with &apos;newFunction(param, {'{version: 2}'})&apos;.&quot;
            </p>
          </div>
        </div>
        
        {/* Repositories */}
        <div className={appStyles.formGroup}>
          <label htmlFor="repositories" className={appStyles.label}>
            Repositories *
          </label>
          {repositoriesStatus === 'loading' ? (
            <p>Loading repositories...</p>
          ) : repositoriesStatus === 'error' ? (
            <div className={appStyles.error}>
              <p>Error loading repositories: {repositoriesError?.message}</p>
              <button 
                type="button"
                className={`${appStyles.button} ${appStyles.buttonPrimary}`}
                onClick={() => loadRepositories(1, 100)}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <select
                id="repositories"
                name="repositories"
                multiple
                value={formData.repositories}
                onChange={handleRepositoryChange}
                className={`${appStyles.select} ${styles.repositoriesSelect}`}
                size={10}
              >
                {repositories.map(repo => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
              <div className={styles.selectHelp}>
                Hold Ctrl (or Cmd on Mac) to select multiple repositories
              </div>
              {errors.repositories && <div className={appStyles.error}>{errors.repositories}</div>}
            </>
          )}
        </div>
        
        {/* Create Pull Requests */}
        <div className={appStyles.formGroup}>
          <label className={appStyles.checkboxLabel}>
            <input
              type="checkbox"
              name="createPullRequests"
              checked={formData.createPullRequests}
              onChange={handleCheckboxChange}
              className={appStyles.checkbox}
            />
            Create Pull Requests
          </label>
        </div>
        
        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={`${appStyles.button} ${appStyles.buttonPrimary}`}
            disabled={createJobStatus === 'loading'}
          >
            {createJobStatus === 'loading' ? 'Creating...' : 'Create Job'}
          </button>
          <button
            type="button"
            className={`${appStyles.button} ${appStyles.buttonSecondary}`}
            onClick={() => navigate({ to: '/jobs' })}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateJob;