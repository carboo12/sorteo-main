
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
    id?: string;
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
    createdBy: string | null;
}
