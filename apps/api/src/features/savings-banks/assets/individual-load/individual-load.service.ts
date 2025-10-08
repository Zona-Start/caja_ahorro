import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { BankTransactionCategory, paymentMethodEnum } from '@/types/enum';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { associateAccountMovements } from 'src/database/index';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { IndividualLoadDto } from './dto/create-individual-load.dto';

@Injectable()
export class IndividualLoadService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly associateMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
  ) {}
  async create(dto: IndividualLoadDto, userId: number) {
    return this.drizzle.transaction(async (tx) => {
      const payload = {
        associateAccountId: dto.associateAccountId,
        movementType: dto.movementType,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        transactionDate: dto.transactionDate,
        description: dto.description,
        referenceType: 'BANK_TRANSACTION',
      };

      const result = await this.associateMovementsService.create(
        userId,
        payload,
        tx,
      );
      const dataBank = {
        movement: {
          bankAccountId: dto.bankAccountId,
          transactionDate: dto.transactionDate ?? new Date(),
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          description: dto.description ?? 'Abono a cuenta de asociado',
          bankReference: dto.referenceNumber,
          category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
          creditAmount: dto.amount,
          debitAmount: 0,
          createdById: userId,
        },
        links: [
          {
            internalRecordType: 'MEMBER_CONTRIBUTION',
            internalRecordId: result.data.id,
          },
        ],
      };
      const bankResult = await this.bankMovementsService.createAndReconcile(
        dataBank,
        userId,
        tx,
      );

      await tx
        .update(associateAccountMovements)
        .set({
          referenceId: bankResult.movement.id.toString(),
        })
        .where(eq(associateAccountMovements.id, result.data.id));

      return {
        message: result.message,
      };
    });
  }
}
