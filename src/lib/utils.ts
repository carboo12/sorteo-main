import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TurnoInfo } from './types';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Determina el turno actual (mañana, tarde, noche) basado en la hora.
 * @returns Un objeto con la información del turno actual.
 */
export function getCurrentTurno(): TurnoInfo {
  const now = new Date();
  const hours = now.getHours();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  let turno: 'turno1' | 'turno2' | 'turno3';

  if (hours >= 0 && hours < 12) {
    turno = 'turno1'; // Mañana
  } else if (hours >= 12 && hours < 18) {
    turno = 'turno2'; // Tarde
  } else {
    turno = 'turno3'; // Noche
  }

  return {
    date,
    turno,
    key: `${date}_${turno}`,
  };
}