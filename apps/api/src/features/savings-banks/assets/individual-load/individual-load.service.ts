import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { bankTransactionCategory } from '@/types/enum';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
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
    console.log(dto);

    return this.drizzle.transaction(async (tx) => {
      const baking = {
        bankAccountId: dto.bankAccountId,
        transactionDate:
          dto.transactionDate?.toISOString() ?? new Date().toISOString(),
        transactionType: dto.paymentMethod,
        description: dto.description ?? 'Abono a cuenta de asociado',
        debitAmount: 0,
        creditAmount: dto.amount,
        bankReference: dto.referenceNumber,
        createdById: userId,
        category: 'DEPOSIT' as bankTransactionCategory,
      };
      const bankResult = await this.bankMovementsService.create(
        baking,
        userId,
        tx,
      );
      const payload = {
        associateAccountId: dto.associateAccountId,
        movementType: dto.movementType,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        transactionDate: dto.transactionDate,
        description: dto.description,
        referenceId: bankResult.id.toString(),
        referenceType: 'BANK_TRANSACTION',
      };

      const result = await this.associateMovementsService.create(
        userId,
        payload,
        tx,
      );
      return result;
    });
  }
}
