import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoanPaymentEvents {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitLoanPaid(loanId: string, paymentId: string, amount: number): void {
    this.eventEmitter.emit('loan.paid', { loanId, paymentId, amount });
  }

  emitPaymentCreated(loanId: string, paymentId: string, amount: number): void {
    this.eventEmitter.emit('loan.payment.created', { loanId, paymentId, amount });
  }

  emitPaymentCancelled(loanId: string, paymentId: string): void {
    this.eventEmitter.emit('loan.payment.cancelled', { loanId, paymentId });
  }
}
