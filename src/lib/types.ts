

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
    prize: string;
    drawnAt: string;
    turno: 'turno1' | 'turno2' | 'turno3';
    date: string;
    // Prize claim fields
    claimed?: boolean;
    claimedAt?: string;
    claimerId?: string; // National ID of the person who claimed
    claimedByUserId?: string; // ID of the employee who registered the claim
    claimedByUserName?: string;
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

export interface FinancialSettings {
    exchangeRateUSDToNIO: number;
    ticketPrice: number;
}

export interface TurnosSettings {
     turnos: {
        turno1: { enabled: boolean; drawTime: string; prize: string; };
        turno2: { enabled: boolean; drawTime: string; prize: string; };
        turno3: { enabled: boolean; drawTime: string; prize: string; };
    };
}

export interface BusinessSettings extends FinancialSettings, TurnosSettings {
    id: string; 
}


export interface EventLog {
    id: string;
    timestamp: string; // ISO 8601 format
    userId: string;
    userName: string;
    businessId: string | null;
    businessName: string | null;
    action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'claim';
    entity: 'user' | 'business' | 'ticket' | 'raffle' | 'settings' | 'prize';
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

    