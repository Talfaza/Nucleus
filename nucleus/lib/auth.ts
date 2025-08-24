import axios from 'axios';

export interface User {
  id: number;
  username: string;
  email: string;
}

// Check if user is authenticated by verifying JWT cookie
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await axios.get('http://localhost:9872/auth/verify', {
      withCredentials: true, // Include cookies
      validateStatus: (status) => status >= 200 && status < 300,
    });
    return response.data.user;
  } catch (error) {
    return null;
  }
}

// Logout user
export async function logout(): Promise<void> {
  try {
    await axios.get('http://localhost:9872/auth/logout', {
      withCredentials: true,
    });
    // Redirect to auth page
    window.location.href = '/auth';
  } catch (error) {
    // Even if logout fails, redirect to auth page
    window.location.href = '/auth';
  }
}

// Redirect to auth page if not authenticated
export function redirectToAuth(): void {
  window.location.href = '/auth';
}
