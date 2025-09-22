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
import { and, desc, eq, inArray } from 'drizzle-orm';
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
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<{ message: string }> {
    const db = tx ?? this.drizzle;
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

        const descriptionDefault =
          movementType === 'SAVING_CONTRIBUTION'
            ? 'Aporte Asociado'
            : movementType === 'EMPLOYER_CONTRIBUTION'
              ? 'Aporte Empleador'
              : movementType === 'VOLUNTARY_SAVINGS'
                ? 'Aporte Voluntario'
                : description;

        console.log(description);

        const [newMovement] = await tx
          .insert(associateAccountMovements)
          .values({
            associateAccountId,
            movementType: movementType as AssociateMovementTypeEnum,
            amount: amount.toString(),
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate,
            description:
              description === undefined
                ? descriptionDefault
                : description === ''
                  ? descriptionDefault
                  : description,
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
          data: newMovement,
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

  async findAllHaberesByAssociate(associateId: number) {
    // 1. Find the associate's account(s)
    const accounts = await this.drizzle.query.associateAccounts.findMany({
      where: eq(schema.associateAccounts.associateId, associateId),
      columns: {
        id: true,
      },
    });

    if (!accounts.length) {
      return {
        message: `No accounts found for associate with ID ${associateId}`,
        data: [],
      };
    }

    const accountIds = accounts.map((acc) => acc.id);

    // 2. Define the "haberes" movement types
    const haberesTypes = [
      'SAVING_CONTRIBUTION',
      'EMPLOYER_CONTRIBUTION',
      'VOLUNTARY_SAVINGS',
      'DIVIDEND_CREDIT',
    ] as const;

    // 3. Query the movements
    const movements = await this.drizzle
      .select({
        fecha: associateAccountMovements.transactionDate,
        concepto: associateAccountMovements.description,
        tipo: associateAccountMovements.movementType,
        monto: associateAccountMovements.amount,
      })
      .from(associateAccountMovements)
      .where(
        and(
          inArray(associateAccountMovements.associateAccountId, accountIds),
          inArray(associateAccountMovements.movementType, [...haberesTypes]),
        ),
      )
      .orderBy(desc(associateAccountMovements.transactionDate));

    if (!movements.length) {
      return {
        message: 'No haberes movements found for this associate.',
        data: [],
      };
    }

    const formattedMovements = movements.map((m) => ({
      ...m,
      monto: parseFloat(m.monto).toFixed(2),
    }));

    return {
      message: 'Haberes movements fetched successfully.',
      data: formattedMovements,
    };
  }

  async findAllByAssociate(associateId: number) {
    // 1. Find the associate's account(s)
    const accounts = await this.drizzle.query.associateAccounts.findMany({
      where: eq(schema.associateAccounts.associateId, associateId),
      columns: {
        id: true,
      },
    });

    if (!accounts.length) {
      return {
        message: `No accounts found for associate with ID ${associateId}`,
        data: [],
      };
    }

    const accountIds = accounts.map((acc) => acc.id);

    // 2. Query all movements for those accounts
    const movements = await this.drizzle
      .select({
        tipo: associateAccountMovements.movementType,
        monto: associateAccountMovements.amount,
        fecha: associateAccountMovements.transactionDate,
        descripcion: associateAccountMovements.description,
        numeroReferencia: associateAccountMovements.referenceNumber,
      })
      .from(associateAccountMovements)
      .where(inArray(associateAccountMovements.associateAccountId, accountIds))
      .orderBy(desc(associateAccountMovements.transactionDate));

    if (!movements.length) {
      return {
        message: 'No transaction history found for this associate.',
        data: [],
      };
    }

    const formattedMovements = movements.map((m) => ({
      ...m,
      monto: parseFloat(m.monto).toFixed(2),
    }));

    return {
      message: 'Transaction history fetched successfully.',
      data: formattedMovements,
    };
  }
}
