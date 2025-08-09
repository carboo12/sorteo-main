
'use client';

import React from 'react';
import type { Business, Ticket, TurnoInfo } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketReceiptProps {
  businessName: string;
  turnoInfo: TurnoInfo;
  ticket: Ticket;
}

const TicketReceipt = React.forwardRef<HTMLDivElement, TicketReceiptProps>(
  ({ businessName, turnoInfo, ticket }, ref) => {
    
    const formattedDate = format(new Date(turnoInfo.date), "PPP", { locale: es });
    const formattedTime = format(parseISO(ticket.purchasedAt), "h:mm:ss a", { locale: es });

    return (
      <div ref={ref} className="bg-white text-black font-mono p-4 max-w-xs mx-auto border-2 border-dashed border-black">
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase">{businessName}</h2>
          <p className="text-xs">Comprobante de Rifa</p>
        </div>
        <div className="my-4 border-t border-b border-dashed border-black py-2">
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Turno:</span>
            <span className="capitalize">{turnoInfo.turno.replace('turno', ' ')}</span>
          </div>
           <div className="flex justify-between">
            <span>Hora Compra:</span>
            <span>{formattedTime}</span>
          </div>
        </div>
        <div className="text-center my-4">
          <p className="text-lg">Número Jugado</p>
          <p className="text-6xl font-bold tracking-wider">{String(ticket.number).padStart(2, '0')}</p>
        </div>
        <div className="border-t border-dashed border-black pt-2">
           <div className="flex justify-between">
            <span>Comprador:</span>
            <span>{ticket.name}</span>
          </div>
        </div>
        <div className="text-center mt-4">
            <p className="text-xs">¡Mucha Suerte!</p>
        </div>
      </div>
    );
  }
);

TicketReceipt.displayName = 'TicketReceipt';

export default TicketReceipt;
