
export interface Ticket {
  number: number;
  name?: string | null;
  purchasedAt: any; // Using `any` for Firestore Timestamp compatibility
}

export interface TurnoData {
  tickets: Ticket[];
  winningNumber?: number | null;
  winnerName?: string | null;
  drawnAt?: any | null; // Using `any` for Firestore Timestamp compatibility
}

export interface Winner {
  date: string;
  turno: string;
  winningNumber: number;
  winnerName?: string;
  drawnAt: string;
}

export interface TurnoInfo {
  date: string;
  turno: string;
  key: string;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Business {
    id: string;
    name: string;
    phone: string;
    ownerEmail: string;
    licenseExpiresAt: string; // ISO string
    address: string;
    location?: Location;
    createdAt: any; // Firestore Timestamp
}

export interface AppUser {
  uid: string;
  email: string | null;
  username: string;
  nombre: string;
  role: 'superuser' | 'admin' | 'seller' | 'unknown';
  businessId?: string;
}
