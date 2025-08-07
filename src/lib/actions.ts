'use server';

import { adminFirestore, isAdminReady } from './firebase-admin-sdk';
import type { AppUser, Business, Ticket, TurnoData, TurnoInfo, Winner } from './types';
import { selectWinningNumber } from '@/ai/flows/select-winning-number';
import * as admin from 'firebase-admin';

// Helper function to find a user in a specific collection by username
async function findUserInCollection(collectionName: string, username: string): Promise<any | null> {
    const snapshot = await adminFirestore!
        .collection(collectionName)
        .where('nombre', '==', username)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
}


export async function signInWithUsername(username: string): Promise<{
  success: boolean;
  message: string;
  user?: { email: string; role: string, name: string, businessId?: string };
}> {

  const { ready, message } = isAdminReady();
  if (!ready) {
      return { success: false, message };
  }

  try {
    const superuser = await findUserInCollection('masterusers', username);
    if (superuser && superuser.email) {
      return {
        success: true,
        message: 'Superusuario encontrado.',
        user: {
          email: superuser.email,
          role: 'superuser',
          name: superuser.nombre,
        },
      };
    }

    const businessUser = await findUserInCollection('users', username);
    if (businessUser && businessUser.email) {
       return {
        success: true,
        message: 'Usuario encontrado.',
        user: {
          email: businessUser.email,
          role: businessUser.role || 'seller', // Default to 'seller' if no role
          name: businessUser.nombre,
          businessId: businessUser.businessId || null,
        },
      };
    }

    return { success: false, message: 'Usuario no encontrado.' };

  } catch (error: any) {
    console.error('Error in signInWithUsername:', error);
    return { success: false, message: `Ocurrió un error en el servidor: ${error.message}` };
  }
}


export async function getOrCreateUser(uid: string, email: string | null): Promise<AppUser | null> {
    const { ready, message } = isAdminReady();
    if (!ready) {
        throw new Error(message);
    }
  
    const userRef = adminFirestore!.collection('users').doc(uid);
    const userSnap = await userRef.get();
  
    if (userSnap.exists) {
      return userSnap.data() as AppUser;
    }
  
    if (!email) {
      return null;
    }
  
    const superuserSnap = await adminFirestore!.collection('masterusers').where('email', '==', email).limit(1).get();
    if (!superuserSnap.empty) {
        const superuserData = superuserSnap.docs[0].data();
        const appUser: AppUser = {
            uid,
            email,
            name: superuserData.nombre,
            role: 'superuser',
        };
        await userRef.set(appUser);
        return appUser;
    }

    const businessUserSnap = await adminFirestore!.collection('users').where('email', '==', email).limit(1).get();
     if (!businessUserSnap.empty) {
        const businessUserData = businessUserSnap.docs[0].data();
        const appUser: AppUser = {
            uid,
            email,
            name: businessUserData.nombre,
            role: businessUserData.role || 'seller',
            businessId: businessUserData.businessId || null,
        };
        await userRef.set(appUser);
        
        if(businessUserSnap.docs[0].id !== uid) {
            await adminFirestore!.collection('users').doc(businessUserSnap.docs[0].id).delete();
        }
        
        return appUser;
    }

    throw new Error('El usuario no está pre-registrado. Contacta al administrador.');
}


export async function createBusiness(businessData: Omit<Business, 'id'>): Promise<{ success: boolean; message: string; businessId?: string }> {
    const { ready, message } = isAdminReady();
    if (!ready) {
        return { success: false, message };
    }

    try {
        const businessRef = await adminFirestore!.collection('businesses').add(businessData);
        return { success: true, message: 'Negocio creado con éxito.', businessId: businessRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: `Ocurrió un error al crear el negocio: ${error.message}` };
    }
}

export async function getBusinesses(): Promise<Business[]> {
    const { ready, message } = isAdminReady();
    if (!ready) {
        console.error(message);
        return [];
    }
    try {
        const snapshot = await adminFirestore!.collection('businesses').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return [];
    }
}


export async function getTurnoData(turnoInfo: TurnoInfo, businessId: string): Promise<TurnoData> {
    const { ready, message } = isAdminReady();
    if (!ready) throw new Error(message);
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const doc = await adminFirestore!.collection('turnos').doc(docId).get();
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
    const { ready, message } = isAdminReady();
    if (!ready) return { success: false, message };

    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const docRef = adminFirestore!.collection('turnos').doc(docId);

    try {
        await adminFirestore!.runTransaction(async (transaction) => {
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
  const { ready, message } = isAdminReady();
  if (!ready) return { success: false, message };
  
  const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
  const turnoRef = adminFirestore!.collection('turnos').doc(docId);
  const businessRef = adminFirestore!.collection('businesses').doc(businessId);
  
  try {
    const { winningNumber } = await selectWinningNumber();

    if (!winningNumber) {
        throw new Error('No se pudo generar un número ganador.');
    }

    await adminFirestore!.runTransaction(async (transaction) => {
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
  const { ready, message } = isAdminReady();
  if (!ready) {
      console.error(message);
      return [];
  }
  const businessDoc = await adminFirestore!.collection('businesses').doc(businessId).get();
  if (businessDoc.exists) {
    const data = businessDoc.data();
    return (data?.winnerHistory || []).sort((a: Winner, b: Winner) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime());
  }
  return [];
}