
'use server';

import { adminFirestore, adminAuth, admin } from './firebase-admin-sdk';
import type { AppUser, Business, Ticket, TurnoData, TurnoInfo, Winner, UserFormData, UserUpdateData } from './types';
import { selectWinningNumber } from '@/ai/flows/select-winning-number';


export async function logError(context: string, error: any, businessId?: string | null): Promise<void> {
    try {
        const errorData: any = {
            context: context,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            businessId: businessId || null,
        };

        if (error instanceof Error) {
            errorData.errorMessage = error.message;
            errorData.stack = error.stack;
        } else if (typeof error === 'object' && error !== null) {
            errorData.errorMessage = error.message || 'No message';
            errorData.errorCode = error.code || null;
            errorData.stack = error.stack || null;
            errorData.details = JSON.stringify(error);
        } else {
            errorData.details = String(error);
        }
        
        const collection = businessId ? `businesses/${businessId}/error_logs` : 'global_error_logs';
        await adminFirestore.collection(collection).add(errorData);

    } catch (loggingError) {
        console.error("FATAL: Could not write to error log.", loggingError);
    }
}


export async function getOrCreateUser(uid: string, email: string | null): Promise<AppUser | null> {
    const userRef = adminFirestore.collection('users').doc(uid);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
        console.warn(`User with UID ${uid} not found in Firestore. They should be created via the admin panel.`);
        return null;
    }
    
    const userData = userSnap.data() as AppUser;

    if (email === 'carboo12@gmail.com') {
        userData.role = 'superuser';
    } else if (email === 'firebase-adminsdk-fbsvc@sorteo-xpress.iam.gserviceaccount.com') {
        userData.role = 'superuser';
    }
    
    // Final checks before returning user data

    // Check if user is disabled in Firestore
    if (userData?.disabled) {
        await logError('Login attempt by disabled user', { userId: uid });
        // Make sure Firebase Auth state matches Firestore state
        try {
            await adminAuth.updateUser(uid, { disabled: true });
        } catch(e) {
            // This might fail if the user is already disabled, which is fine.
        }
        return null;
    }

    // If user is associated with a business, check the business's status
    if (userData?.businessId) {
        try {
            const businessRef = adminFirestore.collection('businesses').doc(userData.businessId);
            const businessSnap = await businessRef.get();

            if (!businessSnap.exists) {
                await logError('Login attempt by user with non-existent business', { userId: uid, businessId: userData.businessId }, userData.businessId);
                return null; // Business does not exist
            }

            const businessData = businessSnap.data() as Business;
            const now = new Date();
            const licenseExpiresAt = new Date(businessData.licenseExpiresAt);

            // Check if business is disabled or license is expired
            if (businessData.disabled || licenseExpiresAt < now) {
                if (licenseExpiresAt < now && !businessData.disabled) {
                    // Automatically disable if license expired
                    await businessRef.update({ disabled: true });
                }
                await logError('Login attempt for disabled or expired business', { userId: uid, businessId: userData.businessId }, userData.businessId);
                return null;
            }
        } catch(e) {
             await logError('Error checking business status during login', e, userData.businessId);
             return null;
        }
    }
    
    return userData;
}


export async function createBusiness(businessData: Omit<Business, 'id'>): Promise<{ success: boolean; message: string; businessId?: string }> {
    try {
        const dataWithStatus = { ...businessData, disabled: false };
        const businessRef = await adminFirestore.collection('businesses').add(dataWithStatus);
        return { success: true, message: 'Negocio creado con éxito.', businessId: businessRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: `Ocurrió un error al crear el negocio: ${error.message}` };
    }
}

export async function updateBusiness(id: string, businessData: Omit<Business, 'id'>): Promise<{ success: boolean; message: string }> {
    try {
        await adminFirestore.collection('businesses').doc(id).update(businessData);
        return { success: true, message: 'Negocio actualizado con éxito.' };
    } catch (error: any) {
        console.error("Error updating business:", error);
        return { success: false, message: `Ocurrió un error al actualizar el negocio: ${error.message}` };
    }
}

export async function getBusinesses(businessId?: string | null): Promise<Business[]> {
    try {
        let query: admin.firestore.Query = adminFirestore.collection('businesses');
        if (businessId) {
            query = query.where(admin.firestore.FieldPath.documentId(), '==', businessId);
        }
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return [];
    }
}

export async function getBusinessById(id: string): Promise<Business | null> {
    try {
        const doc = await adminFirestore.collection('businesses').doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() } as Business;
    } catch (error) {
        console.error("Error fetching business by ID:", error);
        return null;
    }
}

export async function getUsers(requestingUser: AppUser): Promise<AppUser[]> {
    try {
        let query: admin.firestore.Query = adminFirestore.collection('users');

        if (requestingUser.role === 'admin') {
            if (!requestingUser.businessId) return []; // Admin must have a business
            query = query.where('businessId', '==', requestingUser.businessId);
        } 
        // Superuser gets all users, so no filter is applied.
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as AppUser);
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getUserById(uid: string): Promise<AppUser | null> {
    try {
        const doc = await adminFirestore.collection('users').doc(uid).get();
        if (!doc.exists) {
            return null;
        }
        return doc.data() as AppUser;
    } catch (error) {
        console.error(`Error fetching user by ID (${uid}):`, error);
        return null;
    }
}


export async function createUser(userData: UserFormData, creator: AppUser): Promise<{ success: boolean; message: string; }> {
    try {
        if (creator.role === 'seller') {
            return { success: false, message: 'No tienes permiso para crear usuarios.' };
        }
        
        const businessIdToSet = creator.role === 'superuser' ? userData.businessId : creator.businessId;

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            disabled: false,
        });

        // 2. Create user document in Firestore
        const userRef = adminFirestore.collection('users').doc(userRecord.uid);
        const appUser: AppUser = {
            uid: userRecord.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            businessId: businessIdToSet,
            createdBy: creator.uid,
            disabled: false,
        };
        await userRef.set(appUser);

        return { success: true, message: 'Usuario creado con éxito.' };

    } catch (error: any) {
        console.error("Error creating user:", error);
        let message = 'Ocurrió un error al crear el usuario.';
        if (error.code === 'auth/email-already-exists') {
            message = 'El correo electrónico ya está en uso por otro usuario.';
        }
        return { success: false, message: message };
    }
}

export async function updateUser(uid: string, userData: UserUpdateData, editor: AppUser): Promise<{ success: boolean; message: string }> {
    try {
        const userToEdit = await getUserById(uid);
        if (!userToEdit) {
            return { success: false, message: 'El usuario que intentas editar no existe.' };
        }

        // Permission check
        if (editor.role === 'seller') {
            return { success: false, message: 'No tienes permiso para editar usuarios.' };
        }
        if (editor.role === 'admin') {
            // Admins can't edit themselves, other admins, or users outside their business
            if (uid === editor.uid || userToEdit.role === 'admin' || userToEdit.businessId !== editor.businessId) {
                return { success: false, message: 'No tienes permiso para editar este usuario.' };
            }
        }
        
        const authUpdates: { email?: string; password?: string; displayName?: string } = {};
        const firestoreUpdates: { [key: string]: any } = {};

        if (userData.name && userData.name !== userToEdit.name) {
            authUpdates.displayName = userData.name;
            firestoreUpdates.name = userData.name;
        }
        if (userData.email && userData.email !== userToEdit.email) {
            authUpdates.email = userData.email;
            firestoreUpdates.email = userData.email;
        }
        if (userData.password) {
            authUpdates.password = userData.password;
        }

        // Only superuser can change role and businessId
        if (editor.role === 'superuser') {
            if (userData.role && userData.role !== userToEdit.role) {
                firestoreUpdates.role = userData.role;
            }
            if (userData.businessId !== userToEdit.businessId) {
                firestoreUpdates.businessId = userData.businessId;
            }
        }
        
        // Apply updates
        if (Object.keys(authUpdates).length > 0) {
            await adminAuth.updateUser(uid, authUpdates);
        }
        if (Object.keys(firestoreUpdates).length > 0) {
            await adminFirestore.collection('users').doc(uid).update(firestoreUpdates);
        }

        return { success: true, message: 'Usuario actualizado con éxito.' };

    } catch (error: any) {
        console.error(`Error updating user ${uid}:`, error);
        let message = 'Ocurrió un error al actualizar el usuario.';
        if (error.code === 'auth/email-already-exists') {
            message = 'El correo electrónico ya está en uso por otro usuario.';
        }
        return { success: false, message: message };
    }
}


export async function toggleUserStatus(uid: string, disabled: boolean): Promise<{ success: boolean, message: string }> {
    try {
        // Update Firebase Auth state
        await adminAuth.updateUser(uid, { disabled });

        // Update Firestore document state
        const userRef = adminFirestore.collection('users').doc(uid);
        await userRef.update({ disabled });
        
        const action = disabled ? "inhabilitado" : "habilitado";
        return { success: true, message: `Usuario ${action} correctamente.` };

    } catch (error: any) {
        console.error(`Error toggling user status for ${uid}:`, error);
        return { success: false, message: `Ocurrió un error: ${error.message}` };
    }
}


export async function getTurnoData(turnoInfo: TurnoInfo, businessId: string): Promise<TurnoData> {
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const doc = await adminFirestore.collection('turnos').doc(docId).get();
    if (doc.exists) {
        return doc.data() as TurnoData;
    }
    return { tickets: [] };
}

export async function buyTicket(
  turnoInfo: TurnoInfo,
  number: number,
  name: string | null,
  businessId: string
): Promise<{ success: boolean; message: string }> {
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const docRef = adminFirestore.collection('turnos').doc(docId);

    try {
        await adminFirestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            const data = doc.exists ? doc.data() as TurnoData : { tickets: [] };
            const tickets = data.tickets || [];
            if (tickets.some((t: Ticket) => t.number === number)) {
                throw new Error(`El número ${number} ya ha sido vendido.`);
            }
            const newTicket: Ticket = { 
                number, 
                name: name || 'Anónimo', 
                purchasedAt: new Date().toISOString() 
            };
            tickets.push(newTicket);
            transaction.set(docRef, { ...data, tickets }, { merge: true });
        });
        return { success: true, message: `¡Número ${number} comprado con éxito!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function drawWinner(turnoInfo: TurnoInfo, businessId: string): Promise<{ success: boolean; message: string; winningNumber?: number }> {
  const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
  const turnoRef = adminFirestore.collection('turnos').doc(docId);
  const businessRef = adminFirestore.collection('businesses').doc(businessId);
  
  try {
    const { winningNumber } = await selectWinningNumber();

    if (!winningNumber) {
        throw new Error('No se pudo generar un número ganador.');
    }

    await adminFirestore.runTransaction(async (transaction) => {
      const turnoDoc = await transaction.get(turnoRef);
      const businessDoc = await transaction.get(businessRef);
      
      if (!turnoDoc.exists) {
        throw new Error("No hay datos para este turno. No se puede realizar el sorteo.");
      }
      if (!businessDoc.exists) {
        throw new Error("Negocio no encontrado.");
      }

      const turnoData = turnoDoc.data() as TurnoData;
      const ticketWinner = (turnoData?.tickets || []).find((t: Ticket) => t.number === winningNumber);

      const winnerHistoryEntry: Winner = {
        winningNumber: winningNumber,
        winnerName: ticketWinner?.name || 'Sin Reclamar',
        drawnAt: new Date().toISOString(),
        turno: turnoInfo.turno,
        date: turnoInfo.date,
      };

      transaction.update(turnoRef, { winningNumber });
      transaction.update(businessRef, { 
        winnerHistory: admin.firestore.FieldValue.arrayUnion(winnerHistoryEntry)
      });
    });

    return { success: true, winningNumber, message: `El número ganador es ${winningNumber}!` };
  } catch (error: any) {
    console.error("Error in drawWinner:", error);
    return { success: false, message: error.message };
  }
}

export async function getWinnerHistory(businessId: string): Promise<Winner[]> {
  const businessDoc = await adminFirestore.collection('businesses').doc(businessId).get();
  if (businessDoc.exists) {
    const data = businessDoc.data();
    return (data?.winnerHistory || []).sort((a: Winner, b: Winner) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime());
  }
  return [];
}
