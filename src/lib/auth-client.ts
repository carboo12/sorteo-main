
'use client';

import type { AppUser } from './types';

const USER_SESSION_KEY = 'sorteo_xpress_user_session';

/**
 * Guarda la información del usuario en localStorage para iniciar una sesión.
 * @param user - El objeto de usuario para guardar.
 */
export function login(user: AppUser): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      // Forzar la actualización del token de Firebase Auth, aunque la sesión principal es local
      // Esto asegura que las llamadas a `useAuth` se actualicen
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error al guardar la sesión del usuario:", error);
    }
  }
}

/**
 * Elimina la información del usuario de localStorage para cerrar la sesión.
 */
export function signOutUser(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(USER_SESSION_KEY);
      // Limpiar cookie de Firebase por si acaso
      document.cookie = 'firebaseIdToken=; path=/; max-age=-1';
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error al cerrar la sesión del usuario:", error);
    }
  }
}

/**
 * Obtiene el usuario actual desde localStorage.
 * @returns El objeto de usuario si existe, de lo contrario null.
 */
export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const userSession = window.localStorage.getItem(USER_SESSION_KEY);
    return userSession ? JSON.parse(userSession) : null;
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
    return null;
  }
}
