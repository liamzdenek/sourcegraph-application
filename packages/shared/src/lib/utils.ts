/**
 * Utility functions for the shared package
 */

import { ErrorResponse } from './types';

/**
 * Get an environment variable or return a default value
 * @param name The name of the environment variable
 * @param defaultValue The default value to return if the environment variable is not set
 * @returns The value of the environment variable or the default value
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Get an environment variable as a number or return a default value
 * @param name The name of the environment variable
 * @param defaultValue The default value to return if the environment variable is not set
 * @returns The value of the environment variable as a number or the default value
 */
export function getNumberEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Get an environment variable as a boolean or return a default value
 * @param name The name of the environment variable
 * @param defaultValue The default value to return if the environment variable is not set
 * @returns The value of the environment variable as a boolean or the default value
 */
export function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export function formatError(message: string, code = 'INTERNAL_SERVER_ERROR'): ErrorResponse {
  return {
    message,
    code,
    error: {
      message,
      code,
    },
  };
}

/**
 * Format a date string to a human-readable format
 * @param dateString The date string to format
 * @returns The formatted date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleString();
}