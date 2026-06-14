import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import * as schema from '@/database/schema';
import { BankTransactionCategory, paymentMethodEnum } from '@/types/enum';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class LoanPaymentBank implements OnModuleInit {
  private bankMovementsService: BankMovementsService;

  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, {
      strict: false,
    });
  }

  async registerPaymentMovement(
    data: {
      bankAccountId: string;
      transactionDate: Date;
      paymentMethod: string;
      description: string;
      bankReference?: string;
      category: BankTransactionCategory;
      creditAmount: number;
      debitAmount: number;
      createdBy: string;
      internalRecordType: string;
      internalRecordId: string;
    },
    userId: string,
    tenantId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const dataBank = {
      movement: {
        bankAccountId: data.bankAccountId,
        transactionDate: data.transactionDate,
        paymentMethod: data.paymentMethod as paymentMethodEnum,
        description: data.description,
        bankReference: data.bankReference,
        category: data.category,
        creditAmount: data.creditAmount,
        debitAmount: data.debitAmount,
        createdBy: data.createdBy,
      },
      links: [
        {
          internalRecordType: data.internalRecordType,
          internalRecordId: data.internalRecordId,
        },
      ],
    };

    await this.bankMovementsService.createAndReconcile(
      dataBank,
      userId,
      tenantId,
      tx,
    );
  }
}
