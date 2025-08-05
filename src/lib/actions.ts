
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
  Timestamp,
  serverTimestamp,
  addDoc,
  query,
} from 'firebase/firestore';
import { firestore } from './firebase'; // Use client-initialized instance on server
import { firestore as adminFirestore } from './firebase-admin'; // Admin SDK for privileged actions
import { selectWinningNumber } from '@/ai/flows/select-winning-number';
import type { TurnoData, Winner, Ticket, TurnoInfo, Business, Location } from './types';

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
    const docRef = doc(firestore, 'businesses', businessId, 'raffles', date);
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
    const raffleDocRef = doc(firestore, 'businesses', businessId, 'raffles', date);

    await runTransaction(firestore, async (transaction) => {
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
        purchasedAt: serverTimestamp(),
      };
      
      const newTicketsArray = [...tickets, newTicket];

      if (!raffleDoc.exists()) {
        transaction.set(raffleDocRef, { [turno]: { tickets: newTicketsArray } });
      } else {
        transaction.update(raffleDocRef, { [`${turno}.tickets`]: newTicketsArray });
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
   const raffleDocRef = doc(firestore, 'businesses', businessId, 'raffles', date);
   const monthId = date.substring(0, 7); // YYYY-MM
   const winningHistoryRef = doc(firestore, 'businesses', businessId, 'winningHistory', monthId);

   try {
     let winningNumber: number;
     await runTransaction(firestore, async (transaction) => {
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
            [`${turno}.drawnAt`]: serverTimestamp(),
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
    const rafflesCollectionRef = collection(firestore, 'businesses', businessId, 'raffles');
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
            drawnAt: (data[turno].drawnAt as Timestamp).toDate(),
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
    try {
        const businessData = {
            ...data,
            licenseExpiresAt: Timestamp.fromDate(new Date(data.licenseExpiresAt)),
            createdAt: Timestamp.now()
        };
        const docRef = await adminFirestore.collection("businesses").add(businessData);
        return { success: true, message: "Negocio creado con éxito", businessId: docRef.id };
    } catch (error: any) {
        console.error("Error creating business:", error);
        return { success: false, message: error.message || "No se pudo crear el negocio." };
    }
}

export async function getBusinesses(): Promise<Business[]> {
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
                licenseExpiresAt: (data.licenseExpiresAt as Timestamp).toDate().toISOString(),
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
