
'use server';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  runTransaction,
  collection,
  getDocs,
  Timestamp as ClientTimestamp,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore as clientFirestore } from './firebase'; 
import { adminFirestore, adminAuth } from './firebase-admin-sdk';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { selectWinningNumber } from '@/ai/flows/select-winning-number';
import type { TurnoData, Winner, Ticket, TurnoInfo, Business, Location, AppUser } from './types';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const SUPERUSER_EMAIL = 'carboo12@gmail.com';

export async function signInWithUsername(username: string, password: string): Promise<{ success: boolean; message: string; user?: AppUser }> {
    if (!adminFirestore || !adminAuth) {
        return { success: false, message: "El servicio de autenticación del servidor no está disponible. Verifica las credenciales del servidor." };
    }
    
    try {
        const usersRef = adminFirestore.collection("users");
        // Firestore Admin SDK queries are case-sensitive. We query by lowercase username.
        const userQuery = usersRef.where("nombre", "==", username.toLowerCase());
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            // No user found with that username
            return { success: false, message: "Usuario o contraseña incorrectos." };
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;

        if (!userData.email) {
            return { success: false, message: "La cuenta de usuario está mal configurada. Contacta con el administrador." };
        }
        
        // This is a workaround to validate the password using the client SDK's logic.
        // It's not ideal, but it's a common pattern when you don't want to use custom tokens.
        // We let the client-side sign-in do the actual password check.
        // The server action's job is to find the email for a given username.
        return { success: true, message: "Usuario encontrado.", user: userData };

    } catch (error: any) {
        console.error("Error en signInWithUsername:", error);
        // Don't expose detailed server errors to the client
        return { success: false, message: "Ha ocurrido un error en el servidor." };
    }
}


function safeParseTurnoData(data: any): TurnoData {
  const tickets = (data?.tickets || []).map((ticket: any) => ({
    ...ticket,
    purchasedAt: ticket.purchasedAt?.toDate ? ticket.purchasedAt.toDate().toISOString() : null,
  }));
  return {
    tickets,
    winningNumber: data?.winningNumber || null,
    winnerName: data?.winnerName || null,
    drawnAt: data?.drawnAt?.toDate ? data.drawnAt.toDate().toISOString() : null,
  };
}


export async function getTurnoData(
  { date, turno }: TurnoInfo,
  businessId: string
): Promise<TurnoData> {
  if (!businessId) {
    console.error("Business ID is required to fetch turno data");
    return { tickets: [] };
  }
  try {
    const docRef = doc(clientFirestore, 'businesses', businessId, 'raffles', date);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dayData = docSnap.data();
      const turnoData = dayData[turno] || { tickets: [] };
      return safeParseTurnoData(turnoData);
    } else {
      return { tickets: [] };
    }
  } catch (error) {
    console.error('Error getting turno data:', error);
    throw new Error('Could not fetch raffle data.');
  }
}

export async function buyTicket(
  { date, turno }: TurnoInfo,
  number: number,
  name: string | null,
  businessId: string
): Promise<{ success: boolean; message: string }> {
   if (!businessId) {
    return { success: false, message: "Business ID no encontrado." };
  }
  try {
    const raffleDocRef = doc(clientFirestore, 'businesses', businessId, 'raffles', date);

    await runTransaction(clientFirestore, async (transaction) => {
      const raffleDoc = await transaction.get(raffleDocRef);
      
      let dayData = raffleDoc.exists() ? raffleDoc.data() : {};
      
      if (!dayData[turno]) {
        dayData[turno] = { tickets: [] };
      }
      
      const tickets: Ticket[] = dayData[turno].tickets || [];
      const isSold = tickets.some((ticket) => ticket.number === number);

      if (isSold) {
        throw new Error(`El número ${number} ya ha sido vendido en este turno.`);
      }

      const newTicket = {
        number,
        name: name || 'Anónimo',
        purchasedAt: new Date(), // Use standard Date object here
      };
      
      const newTicketsArray = [...tickets, newTicket];

      const updateData = { [`${turno}.tickets`]: newTicketsArray };

      if (!raffleDoc.exists()) {
        transaction.set(raffleDocRef, { [turno]: { tickets: newTicketsArray } });
      } else {
        transaction.update(raffleDocRef, updateData);
      }
    });

    return { success: true, message: `¡Número ${number} comprado con éxito!` };
  } catch (error: any) {
    console.error('Error buying ticket:', error);
    return { success: false, message: error.message || 'No se pudo comprar el número.' };
  }
}

export async function drawWinner(
  { date, turno }: TurnoInfo,
  businessId: string
): Promise<{ success: boolean; message: string; winningNumber?: number }> {
   if (!businessId) {
    return { success: false, message: "Business ID no encontrado." };
  }
  if (!adminFirestore) {
    return { success: false, message: "El servicio de sorteos no está disponible. Verifica las credenciales del servidor." };
  }
   const raffleDocRef = doc(clientFirestore, 'businesses', businessId, 'raffles', date);
   const monthId = date.substring(0, 7); // YYYY-MM
   const winningHistoryRef = doc(clientFirestore, 'businesses', businessId, 'winningHistory', monthId);

   try {
     let winningNumber: number;
     await runTransaction(clientFirestore, async (transaction) => {
        const [raffleDoc, historyDoc] = await Promise.all([
            transaction.get(raffleDocRef),
            transaction.get(winningHistoryRef)
        ]);

        if (!raffleDoc.exists() || !raffleDoc.data()[turno] || raffleDoc.data()[turno].tickets.length === 0) {
            throw new Error('No hay números vendidos en este turno para realizar el sorteo.');
        }

        const turnoData = safeParseTurnoData(raffleDoc.data()[turno]);

        if (turnoData.winningNumber) {
            throw new Error('Ya se ha seleccionado un ganador para este turno.');
        }

        const monthlyWinners = historyDoc.exists() ? historyDoc.data().numbers || [] : [];

        let winningNumberData;
        let attempts = 0;
        const MAX_ATTEMPTS = 15;

        do {
            attempts++;
            if (attempts > MAX_ATTEMPTS) {
                throw new Error('No se pudo encontrar un número ganador único este mes. Inténtalo de nuevo.');
            }
            winningNumberData = await selectWinningNumber();
        } while (monthlyWinners.includes(winningNumberData.winningNumber));

        winningNumber = winningNumberData.winningNumber;

        const winnerTicket = turnoData.tickets.find(t => t.number === winningNumber);
        const winnerName = winnerTicket?.name || 'Anónimo';

        transaction.update(raffleDocRef, {
            [`${turno}.winningNumber`]: winningNumber,
            [`${turno}.winnerName`]: winnerName,
            [`${turno}.drawnAt`]: AdminTimestamp.now(), 
        });
        
        if (historyDoc.exists()) {
            transaction.update(winningHistoryRef, {
                numbers: arrayUnion(winningNumber),
            });
        } else {
            transaction.set(winningHistoryRef, {
                numbers: [winningNumber],
            });
        }
     });

     return { success: true, message: `¡El número ganador es ${winningNumber}!`, winningNumber };

   } catch (error: any) {
       console.error('Error drawing winner:', error);
       return { success: false, message: error.message || 'No se pudo realizar el sorteo.' };
   }
}

export async function getWinnerHistory(businessId: string): Promise<Winner[]> {
  if (!businessId) return [];
  try {
    const rafflesCollectionRef = collection(clientFirestore, 'businesses', businessId, 'raffles');
    const querySnapshot = await getDocs(rafflesCollectionRef);
    const winners: any[] = [];

    querySnapshot.forEach((dayDoc) => {
      const date = dayDoc.id;
      const data = dayDoc.data();
      for (const turno of ['turno1', 'turno2', 'turno3']) {
        if (data[turno] && data[turno].winningNumber && data[turno].drawnAt) {
          winners.push({
            date,
            turno,
            winningNumber: data[turno].winningNumber,
            winnerName: data[turno].winnerName || 'Anónimo',
            drawnAt: (data[turno].drawnAt as ClientTimestamp).toDate(),
          });
        }
      }
    });

    winners.sort((a, b) => b.drawnAt.getTime() - a.drawnAt.getTime());

    return winners.map((winner) => ({
      ...winner,
      drawnAt: winner.drawnAt.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  } catch (error) {
    console.error('Error getting winner history:', error);
    return [];
  }
}

export async function createBusiness(
    data: Omit<Business, 'id' | 'createdAt'>
): Promise<{ success: boolean; message: string; businessId?: string }> {
    if (!adminFirestore) {
        return { success: false, message: "El servicio de creación de negocios no está disponible. Verifica las credenciales del servidor." };
    }
    try {
        const businessData = {
            ...data,
            licenseExpiresAt: AdminTimestamp.fromDate(new Date(data.licenseExpiresAt)),
            createdAt: AdminTimestamp.now()
        };
        const docRef = await adminFirestore.collection("businesses").add(businessData);
        return { success: true, message: "Negocio creado con éxito", businessId: docRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: error.message || "No se pudo crear el negocio." };
    }
}

export async function getBusinesses(): Promise<Business[]> {
    if (!adminFirestore) {
        console.error("El servicio de negocios no está disponible. Verifica las credenciales del servidor.");
        return [];
    }
    try {
        const businessesRef = adminFirestore.collection('businesses');
        const querySnapshot = await businessesRef.get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                phone: data.phone,
                ownerEmail: data.ownerEmail,
                licenseExpiresAt: (data.licenseExpiresAt as AdminTimestamp).toDate().toISOString(),
                address: data.address,
                location: data.location,
                createdAt: data.createdAt,
            }
        });
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return [];
    }
}

export async function getOrCreateUser(uid: string, email: string | null): Promise<AppUser> {
    if (!adminFirestore || !adminAuth) {
        throw new Error("El servicio de usuarios no está disponible. Verifica las credenciales del servidor.");
    }
    const userDocRef = adminFirestore.collection('users').doc(uid);
    
    try {
        const userDocSnap = await userDocRef.get();
        const isSuperuser = email === SUPERUSER_EMAIL;

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as AppUser;
            if (isSuperuser && userData.role !== 'superuser') {
                await userDocRef.update({ role: 'superuser' });
                return { ...userData, role: 'superuser' };
            }
            return userData;
        } else {
            const role = isSuperuser ? 'superuser' : 'unknown';
            const username = email ? email.split('@')[0].toLowerCase() : `user_${uid.substring(0, 5)}`;
            
            const newUser: AppUser = {
                uid,
                email,
                username: username,
                role,
            };
            await userDocRef.set({ ...newUser, nombre: username, createdAt: AdminTimestamp.now() });
            
            if (isSuperuser) {
                await adminAuth.setCustomUserClaims(uid, { role: 'superuser' });
            }

            return newUser;
        }
    } catch (error) {
        console.error("Error getting or creating user:", error);
        throw new Error("Failed to get or create user profile.");
    }
}
