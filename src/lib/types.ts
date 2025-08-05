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
