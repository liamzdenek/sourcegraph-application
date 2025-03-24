import { z } from 'zod';
import { ErrorResponse } from './types';

/**
 * Generate a unique ID
 * @returns A unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Get the current timestamp in ISO format
 * @returns Current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format an error response
 * @param message Error message
 * @param code Error code
 * @returns Error response object
 */
export function formatError(message: string, code = 'INTERNAL_SERVER_ERROR'): ErrorResponse {
  return {
    error: {
      message,
      code,
    },
  };
}

/**
 * Validate data against a Zod schema
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validated data or throws an error
 */
export function validateWithSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation error: ${message}`);
    }
    throw error;
  }
}

/**
 * Sleep for a specified duration
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Chunk an array into smaller arrays
 * @param array Array to chunk
 * @param size Chunk size
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

/**
 * Parse environment variable
 * @param name Environment variable name
 * @param defaultValue Default value
 * @returns Environment variable value or default value
 */
export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
}

/**
 * Parse boolean environment variable
 * @param name Environment variable name
 * @param defaultValue Default value
 * @returns Boolean value of environment variable or default value
 */
export function getBooleanEnv(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse number environment variable
 * @param name Environment variable name
 * @param defaultValue Default value
 * @returns Number value of environment variable or default value
 */
export function getNumberEnv(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not defined`);
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} is not a number`);
  }
  return parsed;
}

/**
 * Get error message from unknown error
 * @param error Unknown error
 * @returns Error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}