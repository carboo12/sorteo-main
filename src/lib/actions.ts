
'use server';

import './firebase-admin-sdk'; // <-- Ensure Admin SDK is initialized
import { adminFirestore, adminAuth } from './firebase-admin-sdk';
import type { AppUser, Business, Ticket, TurnoData, TurnoInfo, Winner } from './types';
import { selectWinningNumber } from '@/ai/flows/select-winning-number';
import * as admin from 'firebase-admin';

export async function logError(context: string, error: any): Promise<void> {
    try {
        const errorData: any = {
            context: context,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
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

        await adminFirestore.collection('error_logs').add(errorData);
    } catch (loggingError) {
        console.error("FATAL: Could not write to error log.", loggingError);
    }
}


export async function getOrCreateUser(uid: string, email: string | null): Promise<AppUser | null> {
    const userRef = adminFirestore.collection('users').doc(uid);
    const userSnap = await userRef.get();
  
    if (userSnap.exists) {
      return userSnap.data() as AppUser;
    }
  
    if (!email) {
      return null;
    }
  
    // Check if the user is a pre-registered business user by email
    const businessUserQuery = adminFirestore.collection('users').where('email', '==', email);
    const businessUserSnapshot = await businessUserQuery.get();
     
    if (!businessUserSnapshot.empty) {
        const oldUserDoc = businessUserSnapshot.docs[0];
        const oldUserData = oldUserDoc.data();
        const oldDocId = oldUserDoc.id;

        // Create the definitive AppUser object with all data
        const appUser: AppUser = {
            uid,
            email,
            name: oldUserData.name || 'Usuario', // Use existing name
            role: oldUserData.role || 'seller', // Use existing role
            businessId: oldUserData.businessId || null, // Critical: Use existing businessId
        };
        
        // Set the new user document with the correct Firebase Auth UID as the ID
        await userRef.set(appUser);
        
        // Delete the old pre-registered document if its ID is different
        if(oldDocId !== uid) {
            await adminFirestore.collection('users').doc(oldDocId).delete();
        }
        
        return appUser;
    }

    // Fallback if user is not pre-registered (should not happen based on current logic)
    throw new Error('El usuario no está pre-registrado. Contacta al administrador.');
}


export async function createBusiness(businessData: Omit<Business, 'id'>): Promise<{ success: boolean; message: string; businessId?: string }> {

    try {
        const businessRef = await adminFirestore.collection('businesses').add(businessData);
        return { success: true, message: 'Negocio creado con éxito.', businessId: businessRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: `Ocurrió un error al crear el negocio: ${error.message}` };
    }
}

export async function getBusinesses(): Promise<Business[]> {
    try {
        const snapshot = await adminFirestore.collection('businesses').get();
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
