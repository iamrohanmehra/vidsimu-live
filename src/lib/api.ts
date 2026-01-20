import type { Event, User } from '@/types';

const API_BASE = 'https://codekaro.in/api';

/**
 * Fetch batch/event details by ID
 */
export async function fetchBatch(batchId: string): Promise<Event | null> {
  try {
    const response = await fetch(`${API_BASE}/batch/${batchId}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch batch: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data as Event;
  } catch (error) {
    console.error('Error fetching batch:', error);
    return null;
  }
}

/**
 * Verify user by email
 */
export async function fetchUser(email: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE}/user/${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch user: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check for error response
    if (data.error) {
      console.error('User not found:', data.error);
      return null;
    }
    
    return {
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Storage keys
const STORAGE_KEY = 'ck_stream_user';

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    console.error('Error reading stored user');
  }
  return null;
}

/**
 * Store user in localStorage
 */
export function storeUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    console.error('Error storing user');
  }
}

/**
 * Clear stored user
 */
export function clearStoredUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Error clearing stored user');
  }
}
