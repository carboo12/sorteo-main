
export interface Ticket {
    number: number;
    name: string;
    purchasedAt: string;
}

export interface TurnoData {
    tickets: Ticket[];
    winningNumber?: number;
}

export interface TurnoInfo {
    date: string;
    turno: 'turno1' | 'turno2' | 'turno3';
    key: string;
}

export interface Winner {
    winningNumber: number;
    winnerName: string;
    drawnAt: string;
    turno: string;
    date: string;
}

export interface AppUser {
    uid: string;
    email: string | null;
    name: string;
    role: 'superuser' | 'admin' | 'seller';
    businessId: string | null;
    createdBy?: string | null;
    disabled?: boolean;
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
    licenseExpiresAt: string;
    address: string;
    location?: Location;
    winnerHistory?: Winner[];
    disabled?: boolean;
}

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'seller';
    businessId: string | null;
}

export interface UserUpdateData {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'seller';
    businessId?: string | null;
}

// New Types for new features

export interface BusinessSettings {
    id: string; // Should be the same as the businessId
    exchangeRateUSDToNIO: number;
    // Add other business-specific settings here
}

export interface EventLog {
    id: string;
    timestamp: string; // ISO 8601 format
    userId: string;
    userName: string;
    businessId: string | null;
    action: 'login' | 'logout' | 'create' | 'update' | 'delete';
    entity: 'user' | 'business' | 'ticket' | 'raffle' | 'settings';
    details: string; // e.g., "User 'admin' updated business 'Sorteo El Trébol'"
}

export interface ErrorLog {
    id: string;
    timestamp: string; // ISO 8601 format
    context: string;
    errorMessage: string;
    stack?: string;
    details?: string;
    businessId?: string | null;
}
