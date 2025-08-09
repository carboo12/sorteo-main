
'use client';

import type { AppUser } from './types';

const USER_KEY = 'app_user';

export function login(user: AppUser) {
  if (typeof window !== 'undefined') {
    // The browser will automatically dispatch a 'storage' event to other tabs.
    // Manually dispatching it was causing an infinite loop in the same tab.
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function signOutUser() {
  if (typeof window !== 'undefined') {
    // The browser will automatically dispatch a 'storage' event to other tabs.
    localStorage.removeItem(USER_KEY);
  }
}

export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Failed to parse user from localStorage', error);
    return null;
  }
}
