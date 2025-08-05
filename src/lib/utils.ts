import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TurnoInfo } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentTurno(): TurnoInfo {
  const now = new Date();
  
  // Using the server's local time. For a distributed application,
  // a consistent timezone like UTC would be preferable.
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  const hour = now.getHours();
  let turno: 'turno1' | 'turno2' | 'turno3';

  if (hour >= 0 && hour < 8) { // From 12:00 AM to 7:59 AM
    turno = 'turno1';
  } else if (hour >= 8 && hour < 16) { // From 8:00 AM to 3:59 PM
    turno = 'turno2';
  } else { // From 4:00 PM to 11:59 PM
    turno = 'turno3';
  }

  return {
    date,
    turno,
    key: `${date}-${turno}`,
  };
}
