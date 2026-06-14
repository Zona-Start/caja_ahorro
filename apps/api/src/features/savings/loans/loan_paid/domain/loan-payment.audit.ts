import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';

@Injectable()
export class LoanPaymentAudit {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  logPaymentCreated(
    userId: string,
    loanFullname: string | null,
    paymentId: string,
    customReference: string,
    auditData: Record<string, any>,
  ): void {
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'loan_payments',
        recordId: paymentId,
        action: 'INSERT',
        userId,
        area: 'PRESTAMOS',
        description: `Pago de Préstamo registrado: ${loanFullname ?? 'ASOCIADO'} (Ref: ${customReference})`,
        newData: [auditData],
      }),
    );
  }

  logPaymentCancelled(
    userId: string,
    paymentId: string,
    customReference: string,
  ): void {
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'loan_payments',
        recordId: paymentId,
        action: 'CANCELED',
        userId,
        area: 'PRESTAMOS',
        description: `Cancelación del pago ${customReference}`,
        newData: [{ status: 'CANCELED' }],
      }),
    );
  }
}
