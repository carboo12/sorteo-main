'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
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
} from 'firebase/firestore';
import { selectWinningNumber } from '@/ai/flows/select-winning-number';
import type { TurnoData, Winner, Ticket, TurnoInfo } from './types';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase project configuration
// and store them securely in environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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
  { date, turno }: TurnoInfo
): Promise<TurnoData> {
  try {
    const docRef = doc(db, 'raffles', date);
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
  name: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const raffleDocRef = doc(db, 'raffles', date);

    await runTransaction(db, async (transaction) => {
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
  { date, turno }: TurnoInfo
): Promise<{ success: boolean; message: string; winningNumber?: number }> {
   const raffleDocRef = doc(db, 'raffles', date);
   const monthId = date.substring(0, 7); // YYYY-MM
   const winningHistoryRef = doc(db, 'winningHistory', monthId);

   try {
     let winningNumber: number;
     await runTransaction(db, async (transaction) => {
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

export async function getWinnerHistory(): Promise<Winner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'raffles'));
    const winners: any[] = []; // Using any to hold Date object temporarily

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

    // Sort by the actual Date object
    winners.sort((a, b) => b.drawnAt.getTime() - a.drawnAt.getTime());

    // Now map to the final Winner[] structure with a formatted, reliable string
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
