
'use server';

import { adminAuth, adminFirestore } from './firebase-admin-sdk';
import type { AppUser, Business } from './types';

// Helper function to find a user in a specific collection by username
async function findUserInCollection(collectionName: string, username: string): Promise<any | null> {
    if (!adminFirestore) return null;

    const normalizedUsername = username.toLowerCase();
    const snapshot = await adminFirestore
        .collection(collectionName)
        .where('nombre', '==', normalizedUsername)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data();
}


/**
 * Finds a user by their username in masterusers or users collection.
 * This function is safe to be called from the client as a Server Action.
 * It only returns non-sensitive information.
 * @param username The username to search for.
 * @returns An object with success status, a message, and user data (email and role).
 */
export async function signInWithUsername(username: string): Promise<{
  success: boolean;
  message: string;
  user?: { email: string; role: string, name: string, businessId?: string };
}> {
  if (!adminFirestore) {
    return { success: false, message: 'El servicio de base de datos no está disponible. Contacta al administrador.' };
  }

  try {
    // 1. Check in 'masterusers' collection
    let userData = await findUserInCollection('masterusers', username);
    let role = 'superuser';

    // 2. If not in 'masterusers', check in 'users' collection
    if (!userData) {
      userData = await findUserInCollection('users', username);
      role = userData?.role || 'seller'; // Default role if not specified
    }

    if (!userData || !userData.email) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    return {
      success: true,
      message: 'Usuario encontrado.',
      user: {
        email: userData.email,
        role: userData.role || role,
        name: userData.nombre,
        businessId: userData.businessId || null,
      },
    };
  } catch (error) {
    console.error('Error in signInWithUsername:', error);
    return { success: false, message: 'Ocurrió un error en el servidor. Por favor, inténtalo de nuevo.' };
  }
}


/**
 * Gets or creates a user profile in Firestore.
 * Triggered after a successful Firebase client-side authentication.
 */
export async function getOrCreateUser(uid: string, email: string | null): Promise<AppUser | null> {
    if (!adminFirestore) {
      console.error("Firestore Admin is not initialized.");
      throw new Error("El servicio de base de datos no está disponible.");
    }
  
    const userRef = adminFirestore.collection('users').doc(uid);
    const userSnap = await userRef.get();
  
    if (userSnap.exists) {
      return userSnap.data() as AppUser;
    }
  
    if (!email) {
      // Cannot create a user without an email
      return null;
    }
  
    // Check if it's a superuser first
    const superuserSnap = await adminFirestore.collection('masterusers').where('email', '==', email).limit(1).get();
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

    // If not a superuser, it must be a business user created beforehand
    const businessUserSnap = await adminFirestore.collection('users').where('email', '==', email).limit(1).get();
     if (!businessUserSnap.empty) {
        const businessUserData = businessUserSnap.docs[0].data();
        const appUser: AppUser = {
            uid, // This is the new UID from Auth
            email,
            name: businessUserData.nombre,
            role: businessUserData.role || 'seller',
            businessId: businessUserData.businessId || null,
        };
        // Update the user document with the new UID
        await adminFirestore.collection('users').doc(uid).set(appUser);

        // Optional: delete the old doc if it had a different, placeholder UID
        if(businessUserSnap.docs[0].id !== uid) {
            await adminFirestore.collection('users').doc(businessUserSnap.docs[0].id).delete();
        }
        
        return appUser;
    }

    // If user is not pre-registered in masterusers or users, deny creation
    throw new Error('El usuario no está registrado en el sistema. Contacta al administrador.');
}


export async function createBusiness(businessData: Omit<Business, 'id'>): Promise<{ success: boolean; message: string; businessId?: string }> {
    if (!adminFirestore) {
      return { success: false, message: 'El servicio de base de datos no está disponible.' };
    }

    try {
        const businessRef = await adminFirestore.collection('businesses').add(businessData);
        return { success: true, message: 'Negocio creado con éxito.', businessId: businessRef.id };
    } catch (error) {
        console.error("Error creating business:", error);
        return { success: false, message: 'Ocurrió un error al crear el negocio.' };
    }
}

export async function getBusinesses(): Promise<Business[]> {
    if (!adminFirestore) {
        console.error("Firestore Admin is not initialized.");
        return [];
    }
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


export async function getTurnoData(turnoInfo: { date: string; turno: string }, businessId: string) {
    if (!adminFirestore) throw new Error("Server not initialized");
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const doc = await adminFirestore.collection('turnos').doc(docId).get();
    if (doc.exists) {
        return doc.data();
    }
    return { tickets: [] };
}

export async function buyTicket(
  turnoInfo: { date: string; turno: string },
  number: number,
  name: string | null,
  businessId: string
) {
    if (!adminFirestore) throw new Error("Server not initialized");
    const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
    const docRef = adminFirestore.collection('turnos').doc(docId);

    try {
        await adminFirestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            const data = doc.exists ? doc.data() : { tickets: [] };
            const tickets = data?.tickets || [];
            if (tickets.some((t: any) => t.number === number)) {
                throw new Error(`El número ${number} ya ha sido vendido.`);
            }
            tickets.push({ number, name: name || 'Anónimo', purchasedAt: new Date().toISOString() });
            transaction.set(docRef, { ...data, tickets }, { merge: true });
        });
        return { success: true, message: `¡Número ${number} comprado con éxito!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function drawWinner(turnoInfo: { date: string; turno: string }, businessId: string) {
  if (!adminFirestore || !adminAuth) throw new Error("Server not initialized");
  
  const docId = `${businessId}_${turnoInfo.date}_${turnoInfo.turno}`;
  const turnoRef = adminFirestore.collection('turnos').doc(docId);
  const businessRef = adminFirestore.collection('businesses').doc(businessId);
  
  try {
    const winningNumber = Math.floor(Math.random() * 100) + 1;

    await adminFirestore.runTransaction(async (transaction) => {
      const turnoDoc = await transaction.get(turnoRef);
      const businessDoc = await transaction.get(businessRef);
      
      if (!turnoDoc.exists) {
        throw new Error("No hay datos para este turno. No se puede realizar el sorteo.");
      }
      if (!businessDoc.exists) {
        throw new Error("Negocio no encontrado.");
      }

      const turnoData = turnoDoc.data();
      const ticketWinner = (turnoData?.tickets || []).find((t: any) => t.number === winningNumber);

      const winnerHistoryEntry = {
        winningNumber: winningNumber,
        winnerName: ticketWinner?.name || 'Sin Reclamar',
        drawnAt: new Date().toISOString(),
        turno: turnoInfo.turno,
        date: turnoInfo.date,
      };

      transaction.set(turnoRef, { winningNumber: winningNumber }, { merge: true });
      transaction.set(businessRef, { 
        winnerHistory: admin.firestore.FieldValue.arrayUnion(winnerHistoryEntry)
      }, { merge: true });
    });

    return { success: true, winningNumber, message: `El número ganador es ${winningNumber}!` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getWinnerHistory(businessId: string) {
  if (!adminFirestore) throw new Error("Server not initialized");
  const businessDoc = await adminFirestore.collection('businesses').doc(businessId).get();
  if (businessDoc.exists) {
    const data = businessDoc.data();
    return (data?.winnerHistory || []).sort((a: any, b: any) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime());
  }
  return [];
}
