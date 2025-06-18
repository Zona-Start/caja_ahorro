import { generateUniqueReference } from '@/common/utils/reference';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  associateAccountBalanceHistory,
  associateAccountMovements,
  associateAccounts,
  auditLogs,
} from '@/database/index';
import { AssociateMovementTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { CreateAssociateAccountsMovementDto } from './dto/create-associate-accounts-movement.dto';
import { UpdateAssociateAccountsMovementDto } from './dto/update-associate-accounts-movement.dto';

@Injectable()
export class AssociateAccountsMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  private async getExchangeRate(code: CurrencyCodeEnum, date: Date) {
    const result = await this.drizzle
      .select({ id: schema.exchangeRates.id })
      .from(schema.exchangeRates)
      .where(
        and(
          eq(schema.exchangeRates.fromCurrencyCode, code),
          eq(schema.exchangeRates.date, date.toISOString().split('T')[0]),
        ),
      );

    if (result.length === 0) {
      throw new NotFoundException(
        `No se encontró una tasa de cambio para la moneda ${code} en la fecha ${date.toISOString()}.`,
      );
    }

    return result[0]; // Devuelve el primer resultado encontrado
  }
  async create(
    userId: number,
    createAssociateAccountsMovementDto: CreateAssociateAccountsMovementDto,
  ): Promise<{ message: string }> {
    try {
      return await this.drizzle.transaction(async (tx) => {
        const {
          associateAccountId,
          movementType,
          amount,
          currencyCode,
          transactionDate,
          description,
          referenceId,
          referenceType,
          referenceNumber,
          area,
        } = createAssociateAccountsMovementDto;

        // 2. Valida si ya existe el movimiento para evitar duplicados
        const existingMovement = await tx
          .select()
          .from(associateAccountMovements)
          .where(
            and(
              eq(
                associateAccountMovements.associateAccountId,
                associateAccountId,
              ),
              eq(
                associateAccountMovements.movementType,
                movementType as AssociateMovementTypeEnum,
              ),
              eq(associateAccountMovements.amount, String(amount)),
              eq(associateAccountMovements.currencyCode, currencyCode),
              eq(
                associateAccountMovements.transactionDate,
                transactionDate ?? new Date(),
              ),
              eq(associateAccountMovements.referenceId, referenceId ?? ''),
              eq(associateAccountMovements.referenceType, referenceType ?? ''),
            ),
          );

        if (existingMovement.length !== 0) {
          throw new NotFoundException('El movimiento ya existe.');
        }

        // 3. Consulta los datos de en associateAccounts por id para obtener el balance
        const account = await tx
          .select()
          .from(associateAccounts)
          .where(eq(associateAccounts.id, associateAccountId));

        if (account.length === 0) {
          throw new NotFoundException(
            `Cuenta de asociado con ID ${associateAccountId} no encontrada.`,
          );
        }
        const reference = referenceNumber ?? generateUniqueReference();

        const exchangeRate =
          currencyCode !== 'VES'
            ? await this.getExchangeRate(
                currencyCode,
                transactionDate ?? new Date(),
              )
            : null;

        // 4. Guarda los datos en associateAccountMovements retornando el id
        const [newMovement] = await tx
          .insert(associateAccountMovements)
          .values({
            associateAccountId,
            movementType: movementType as AssociateMovementTypeEnum,
            amount: amount.toString(),
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate,
            description,
            referenceId,
            referenceType,
            referenceNumber: reference,
            exchangeRateId: exchangeRate?.id ?? null,
            createdById: userId,
          })
          .returning({
            id: associateAccountMovements.id,
            referenceNumber: associateAccountMovements.referenceNumber,
          });

        if (!newMovement?.id) {
          throw new InternalServerErrorException(
            'Error al guardar el movimiento.',
          );
        }

        // 5. Guarda en associateAccountBalanceHistory con el id retornado y el valor del balance
        await tx.insert(associateAccountBalanceHistory).values({
          associateAccountId,
          balanceDate: new Date(),
          balance: account[0].balance,
          movementId: newMovement.id,
          reason: `Registro de movimiento: ${movementType}`,
          createdById: userId,
        });

        // 6. Actualiza el balance de associateAccounts con el valor de amount según el tipo de movimiento
        let newBalanceSql: SQL<unknown>;
        const creditMovements: AssociateMovementTypeEnum[] = [
          // 1. Contribuciones y Aportes a Cuentas de Ahorro
          AssociateMovementTypeEnum.SAVING_CONTRIBUTION,
          AssociateMovementTypeEnum.EMPLOYER_CONTRIBUTION,

          // 2. Desembolsos de Préstamos y Créditos (Aumentan el balance del asociado)
          AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT,
          AssociateMovementTypeEnum.SPECIAL_LOAN_DISBURSEMENT_CREDIT,
          AssociateMovementTypeEnum.LOAN_PARTIAL_DISBURSEMENT_CREDIT, // If disbursed to associate's account
          AssociateMovementTypeEnum.COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT,
          AssociateMovementTypeEnum.SPECIAL_CREDIT_DISBURSEMENT_CREDIT,

          // 3. Refinanciamiento de Préstamos (La parte que acredita el nuevo préstamo)
          AssociateMovementTypeEnum.LOAN_REFINANCING_CREDIT,

          // 4. Sobregiros y Reintegros (Aumentan el balance del asociado)
          AssociateMovementTypeEnum.LOAN_OVERPAYMENT_CREDIT,
          AssociateMovementTypeEnum.COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT,
          AssociateMovementTypeEnum.LOAN_REIMBURSEMENT_CREDIT,
          AssociateMovementTypeEnum.COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT,

          // 5. Otros Créditos (Aumentan el balance del asociado)
          AssociateMovementTypeEnum.DIVIDEND_CREDIT,
          AssociateMovementTypeEnum.FEE_REIMBURSEMENT_CREDIT,
          AssociateMovementTypeEnum.ADJUSTMENT_CREDIT, // Positive adjustments
          AssociateMovementTypeEnum.OTHER_CREDIT, // General credits
        ];

        if (creditMovements.includes(movementType)) {
          newBalanceSql = sql`${associateAccounts.balance} + ${amount}`;
        } else {
          newBalanceSql = sql`${associateAccounts.balance} - ${amount}`;
        }

        await tx
          .update(associateAccounts)
          .set({ balance: newBalanceSql, updatedById: userId })
          .where(eq(associateAccounts.id, associateAccountId));

        const paylodAuditData = {
          associateAccountId,
          movementType: movementType as AssociateMovementTypeEnum,
          amount: amount.toString(),
          currencyCode: currencyCode as CurrencyCodeEnum,
          transactionDate,
          description,
          referenceId,
          referenceType,
          referenceNumber: reference,
          exchangeRateId: exchangeRate?.id ?? null,
        };

        // Registra el log auditoria
        await tx.insert(auditLogs).values({
          tableName: 'associateAccountMovements',
          recordId: String(newMovement.id),
          action: 'INSERT',
          userId: Number(userId),
          area: area ? area : 'HABERES',
          description: description ?? '',
          newData: [paylodAuditData],
        });

        return {
          message: 'successful loaded movement',
        };
      });
    } catch (error) {
      console.error(
        'Error al crear el movimiento de cuenta del asociado:',
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al crear el movimiento de cuenta del asociado.',
      );
    }
  }

  findAll() {
    return `This action returns all associateAccountsMovements`;
  }

  findOne(id: number) {
    return `This action returns a #${id} associateAccountsMovement`;
  }

  update(
    id: number,
    updateAssociateAccountsMovementDto: UpdateAssociateAccountsMovementDto,
  ) {
    return `This action updates a #${id} associateAccountsMovement`;
  }

  remove(id: number) {
    return `This action removes a #${id} associateAccountsMovement`;
  }
}
