

'use server';

import { adminFirestore, adminAuth, admin } from './firebase-admin-sdk';
import type { AppUser, Business, Ticket, TurnoData, TurnoInfo, Winner, UserFormData, UserUpdateData, BusinessSettings, EventLog, ErrorLog, FinancialSettings, TurnosSettings } from './types';


export async function logError(context: string, error: any, businessId?: string | null): Promise<void> {
    try {
        const business = businessId ? await getBusinessById(businessId) : null;
        
        const errorData: Omit<ErrorLog, 'id'> = {
            context: context,
            timestamp: new Date().toISOString(),
            businessId: businessId || null,
            businessName: business?.name || null,
            errorMessage: 'Unknown Error',
        };

        if (error instanceof Error) {
            errorData.errorMessage = error.message;
            errorData.stack = error.stack;
        } else if (typeof error === 'object' && error !== null) {
            errorData.errorMessage = error.message || 'No message';
            errorData.stack = error.stack || null;
            errorData.details = JSON.stringify(error);
        } else {
            errorData.details = String(error);
        }
        
        const collectionPath = businessId ? `businesses/${businessId}/error_logs` : 'global_error_logs';
        await adminFirestore.collection(collectionPath).add(errorData);

    } catch (loggingError) {
        console.error("FATAL: Could not write to error log.", loggingError);
    }
}

// --- Event Logging ---
export async function logEvent(
    user: AppUser,
    action: EventLog['action'],
    entity: EventLog['entity'],
    details: string,
    targetBusinessId?: string | null
): Promise<void> {
    try {
        const eventData: Omit<EventLog, 'id'> = {
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userName: user.name,
            businessId: targetBusinessId === undefined ? user.businessId : targetBusinessId,
            businessName: null, // Will be populated below if applicable
            action,
            entity,
            details,
        };

        if (eventData.businessId) {
            const business = await getBusinessById(eventData.businessId);
            eventData.businessName = business?.name || null;
        }

        await adminFirestore.collection('event_logs').add(eventData);
    } catch (e) {
        console.error("Failed to log event:", e);
        // Optional: log this failure to the error log itself
        await logError("logEvent failed", e, user.businessId);
    }
}

const docToEventLog = (doc: admin.firestore.DocumentSnapshot): EventLog => {
    const data = doc.data() as any;
    return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
    } as EventLog;
};

const docToErrorLog = (doc: admin.firestore.DocumentSnapshot): ErrorLog => {
    const data = doc.data() as any;
    return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
    } as ErrorLog;
}

export async function getEventLogs(requestingUser: AppUser): Promise<EventLog[]> {
    try {
        let query: admin.firestore.Query = adminFirestore.collection('event_logs');

        if (requestingUser.role === 'admin') {
            if (!requestingUser.businessId) return [];
            query = query.where('businessId', '==', requestingUser.businessId);
        }
        // Superuser gets all logs, so no businessId filter

        const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToEventLog);

    } catch (error) {
        console.error("Error fetching event logs:", error);
        await logError("getEventLogs failed", error, requestingUser.businessId);
        return [];
    }
}

export async function getErrorLogs(requestingUser: AppUser): Promise<ErrorLog[]> {
    try {
        let logs: ErrorLog[] = [];

        if (requestingUser.role === 'superuser') {
            // Fetch global errors
            const globalSnapshot = await adminFirestore.collection('global_error_logs').orderBy('timestamp', 'desc').limit(50).get();
            logs = logs.concat(globalSnapshot.docs.map(docToErrorLog));

            // Fetch errors from all businesses
            const businessesSnapshot = await adminFirestore.collection('businesses').get();
            for (const businessDoc of businessesSnapshot.docs) {
                const businessErrorsSnapshot = await businessDoc.ref.collection('error_logs').orderBy('timestamp', 'desc').limit(20).get();
                logs = logs.concat(businessErrorsSnapshot.docs.map(docToErrorLog));
            }

        } else if (requestingUser.role === 'admin' && requestingUser.businessId) {
            const businessErrorsSnapshot = await adminFirestore.collection(`businesses/${requestingUser.businessId}/error_logs`).orderBy('timestamp', 'desc').limit(100).get();
            logs = businessErrorsSnapshot.docs.map(docToErrorLog);
        }

        // Sort all collected logs by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return logs.slice(0, 150); // Return the most recent 150 errors total

    } catch (error) {
        console.error("Error fetching error logs:", error);
        await logError("getErrorLogs failed", error, requestingUser.businessId);
        return [];
    }
}


export async function getOrCreateUser(
    uid: string, 
    email: string | null
): Promise<{ user: AppUser | null; isFirstLogin: boolean }> {
    const userRef = adminFirestore.collection('users').doc(uid);
    let userSnap = await userRef.get();
    let isFirstLogin = false;

    if (!userSnap.exists) {
        isFirstLogin = true;
        // Superuser creation on first login
        if (email === 'carboo12@gmail.com') {
            console.log(`First login for superuser ${email}. Creating user document.`);
            const superUserData: AppUser = {
                uid,
                email,
                name: 'Super User',
                role: 'superuser',
                businessId: null,
            };
            await userRef.set(superUserData);
            return { user: superUserData, isFirstLogin: true };
        }
        console.warn(`User with UID ${uid} not found in Firestore and is not superuser.`);
        return { user: null, isFirstLogin: false };
    }
    
    const userData = userSnap.data() as AppUser;

    // This ensures your account always has superuser privileges, overriding DB value if necessary
    if (email === 'carboo12@gmail.com') {
        userData.role = 'superuser';
    }
    
    if (userData.disabled) {
        await logError('Login attempt by disabled user', { userId: uid }, userData.businessId);
        // No need to disable in Auth again, as getOrCreateUser isn't called if user is disabled in Auth
        return { user: null, isFirstLogin: false };
    }

    if (userData.businessId) {
        try {
            const businessRef = adminFirestore.collection('businesses').doc(userData.businessId);
            const businessSnap = await businessRef.get();

            if (!businessSnap.exists) {
                await logError('Login attempt by user with non-existent business', { userId: uid, businessId: userData.businessId }, userData.businessId);
                return { user: null, isFirstLogin: false };
            }

            const businessData = businessSnap.data() as Business;
            const now = new Date();
            const licenseExpiresAt = new Date(businessData.licenseExpiresAt);

            if (businessData.disabled || licenseExpiresAt < now) {
                if (licenseExpiresAt < now && !businessData.disabled) {
                    await businessRef.update({ disabled: true });
                }
                await logError('Login attempt for disabled or expired business', { userId: uid, businessId: userData.businessId }, userData.businessId);
                return { user: null, isFirstLogin: false };
            }
        } catch(e) {
             await logError('Error checking business status during login', e, userData.businessId);
             return { user: null, isFirstLogin: false };
        }
    }
    
    return { user: userData, isFirstLogin };
}


export async function createBusiness(businessData: Omit<Business, 'id'>, creator: AppUser): Promise<{ success: boolean; message: string; businessId?: string }> {
    try {
        const dataWithStatus = { ...businessData, disabled: false };
        const businessRef = await adminFirestore.collection('businesses').add(dataWithStatus);
        
        await logEvent(creator, 'create', 'business', `Created business '${businessData.name}'`);
        
        return { success: true, message: 'Negocio creado con éxito.', businessId: businessRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: `Ocurrió un error al crear el negocio: ${error.message}` };
    }
}

export async function updateBusiness(id: string, businessData: Omit<Business, 'id'>, editor: AppUser): Promise<{ success: boolean; message: string }> {
    try {
        await adminFirestore.collection('businesses').doc(id).update(businessData);
        await logEvent(editor, 'update', 'business', `Updated business '${businessData.name}' (ID: ${id})`, id);
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
        
        await logEvent(creator, 'create', 'user', `Created user '${userData.name}' (${userData.email})`, businessIdToSet);


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
        
        await logEvent(editor, 'update', 'user', `Updated user '${userToEdit.name}' (UID: ${uid})`, userToEdit.businessId);


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


export async function toggleUserStatus(uid: string, disabled: boolean, editor: AppUser): Promise<{ success: boolean, message: string }> {
    try {
        const userToEdit = await getUserById(uid);
        if (!userToEdit) {
             return { success: false, message: 'Usuario no encontrado.' };
        }
        // Update Firebase Auth state
        await adminAuth.updateUser(uid, { disabled });

        // Update Firestore document state
        const userRef = adminFirestore.collection('users').doc(uid);
        await userRef.update({ disabled });
        
        const action = disabled ? "inhabilitado" : "habilitado";
        const actionVerb: EventLog['action'] = disabled ? 'delete' : 'update'; // Using 'delete' for disable semantically
        
        await logEvent(editor, actionVerb, 'user', `${disabled ? 'Disabled' : 'Enabled'} user '${userToEdit.name}' (UID: ${uid})`, userToEdit.businessId);

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
  ticket: Ticket,
  businessId: string,
  buyer: AppUser,
): Promise<{ success: boolean; message: string }> {
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const docRef = adminFirestore.collection('turnos').doc(docId);

    try {
        await adminFirestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            const data = doc.exists ? doc.data() as TurnoData : { tickets: [] };
            const tickets = data.tickets || [];
            if (tickets.some((t: Ticket) => t.number === ticket.number)) {
                throw new Error(`El número ${ticket.number} ya ha sido vendido.`);
            }
            tickets.push(ticket);
            transaction.set(docRef, { ...data, tickets }, { merge: true });
        });
        
        await logEvent(buyer, 'create', 'ticket', `Sold ticket #${ticket.number} for turno ${turnoInfo.key}`);

        return { success: true, message: `¡Número ${ticket.number} comprado con éxito!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function drawWinner(turnoInfo: TurnoInfo, businessId: string, drawer: AppUser): Promise<{ success: boolean; message: string; winningNumber?: number }> {
  const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
  const turnoRef = adminFirestore.collection('turnos').doc(docId);
  const businessRef = adminFirestore.collection('businesses').doc(businessId);
  
  try {
    let prizeForTurno = 'Premio no definido';
    const settings = await getBusinessSettings(businessId);
    if (settings && settings.turnos) {
        prizeForTurno = settings.turnos[turnoInfo.turno].prize || prizeForTurno;
    }

    const winningNumber = Math.floor(Math.random() * 100) + 1;

    if (winningNumber === undefined) {
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
      if (turnoData.winningNumber) {
        throw new Error("El sorteo para este turno ya se ha realizado.");
      }

      const ticketWinner = (turnoData?.tickets || []).find((t: Ticket) => t.number === winningNumber);

      const winnerHistoryEntry: Winner = {
        winningNumber: winningNumber,
        winnerName: ticketWinner?.name || 'Sin Reclamar',
        prize: prizeForTurno,
        drawnAt: new Date().toISOString(),
        turno: turnoInfo.turno,
        date: turnoInfo.date,
      };

      transaction.update(turnoRef, { winningNumber });
      transaction.update(businessRef, { 
        winnerHistory: admin.firestore.FieldValue.arrayUnion(winnerHistoryEntry)
      });
    });
    
    await logEvent(drawer, 'create', 'raffle', `Drew winner #${winningNumber} for turno ${turnoInfo.key} with prize '${prizeForTurno}'`);


    return { success: true, winningNumber, message: `El número ganador es ${winningNumber}!` };
  } catch (error: any) {
    console.error("Error in drawWinner:", error);
    await logError(`drawWinner failed for business ${businessId}`, error, businessId);
    return { success: false, message: error.message };
  }
}

export async function getWinnerHistory(businessId: string): Promise<Winner[]> {
  const businessDoc = await adminFirestore.collection('businesses').doc(businessId).get();
  if (businessDoc.exists) {
    const data = businessDoc.data();
    const history = data?.winnerHistory || [];
    
    // Sort and serialize timestamps
    return history
        .map((winner: any) => ({
            ...winner,
            drawnAt: winner.drawnAt.toDate ? winner.drawnAt.toDate().toISOString() : winner.drawnAt,
            claimedAt: winner.claimedAt ? (winner.claimedAt.toDate ? winner.claimedAt.toDate().toISOString() : winner.claimedAt) : undefined,
        }))
        .sort((a: Winner, b: Winner) => {
            return new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime();
        });
  }
  return [];
}


// Settings Actions
export async function getBusinessSettings(businessId: string): Promise<BusinessSettings | null> {
    try {
        const docRef = adminFirestore.collection('business_settings').doc(businessId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() } as BusinessSettings;
        }
        // Return default settings if none exist
        return {
            id: businessId,
            exchangeRateUSDToNIO: 36.5,
            ticketPrice: 10,
            turnos: {
                turno1: { enabled: true, drawTime: '11:00', prize: 'Premio Mañana' },
                turno2: { enabled: true, drawTime: '15:00', prize: 'Premio Tarde' },
                turno3: { enabled: true, drawTime: '21:00', prize: 'Premio Noche' },
            },
        };
    } catch (error) {
        console.error("Error getting business settings:", error);
        await logError(`getBusinessSettings failed for business ${businessId}`, error, businessId);
        return null;
    }
}

export async function updateBusinessFinancialSettings(businessId: string, settings: FinancialSettings, editor: AppUser): Promise<{ success: boolean; message: string; }> {
    try {
        const docRef = adminFirestore.collection('business_settings').doc(businessId);
        await docRef.set(settings, { merge: true });
        await logEvent(editor, 'update', 'settings', `Updated financial settings.`);
        return { success: true, message: "Configuración financiera guardada con éxito." };
    } catch (error: any) {
        console.error("Error updating financial settings:", error);
        await logError(`updateBusinessFinancialSettings failed for business ${businessId}`, error, businessId);
        return { success: false, message: `Error al guardar la configuración: ${error.message}` };
    }
}

export async function updateBusinessTurnosSettings(businessId: string, settings: TurnosSettings, editor: AppUser): Promise<{ success: boolean; message: string; }> {
    try {
        const docRef = adminFirestore.collection('business_settings').doc(businessId);
        await docRef.set(settings, { merge: true });
        await logEvent(editor, 'update', 'settings', `Updated turnos settings.`);
        return { success: true, message: "Configuración de turnos guardada con éxito." };
    } catch (error: any) {
        console.error("Error updating turnos settings:", error);
        await logError(`updateBusinessTurnosSettings failed for business ${businessId}`, error, businessId);
        return { success: false, message: `Error al guardar la configuración: ${error.message}` };
    }
}


// Prize Claim Action
export async function claimPrize(
    businessId: string,
    winnerToClaim: Winner,
    claimerId: string,
    employee: AppUser
): Promise<{ success: boolean; message: string; }> {
    const businessRef = adminFirestore.collection('businesses').doc(businessId);
    
    try {
        await adminFirestore.runTransaction(async (transaction) => {
            const businessDoc = await transaction.get(businessRef);
            if (!businessDoc.exists) {
                throw new Error("Negocio no encontrado.");
            }

            const businessData = businessDoc.data() as Business;
            const winnerHistory: Winner[] = businessData.winnerHistory || [];

            const winnerIndex = winnerHistory.findIndex(w => w.drawnAt === winnerToClaim.drawnAt);

            if (winnerIndex === -1) {
                throw new Error("No se encontró el registro del ganador para actualizar.");
            }
            
            if (winnerHistory[winnerIndex].claimed) {
                throw new Error("Este premio ya ha sido entregado.");
            }

            // Update the winner object
            winnerHistory[winnerIndex] = {
                ...winnerHistory[winnerIndex],
                claimed: true,
                claimedAt: new Date().toISOString(),
                claimerId: claimerId,
                claimedByUserId: employee.uid,
                claimedByUserName: employee.name,
            };

            transaction.update(businessRef, { winnerHistory: winnerHistory });
        });
        
        await logEvent(employee, 'claim', 'prize', `Claimed prize for winner #${winnerToClaim.winningNumber} from ${winnerToClaim.date}`);

        return { success: true, message: "Premio entregado exitosamente." };
    } catch (error: any) {
        console.error("Error in claimPrize:", error);
        await logError(`claimPrize failed for business ${businessId}`, error, businessId);
        return { success: false, message: error.message };
    }
}
