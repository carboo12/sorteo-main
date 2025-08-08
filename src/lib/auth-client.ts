
'use client';

import type { AppUser } from './types';

const USER_KEY = 'app_user';

export function login(user: AppUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(
        new StorageEvent('storage', {
            key: USER_KEY,
            newValue: JSON.stringify(user),
        })
    );
  }
}

export function signOutUser() {
  if (typeof window !== 'undefined') {
    const wasPresent = localStorage.getItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
     // Dispatch a storage event to notify other tabs/windows
     if (wasPresent) {
        window.dispatchEvent(
            new StorageEvent('storage', {
                key: USER_KEY,
                newValue: null,
            })
        );
     }
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
