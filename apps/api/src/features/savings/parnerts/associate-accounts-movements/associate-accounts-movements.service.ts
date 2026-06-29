import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  associateAccountBalanceHistory,
  associateAccountMovements,
  associateAccounts,
  associates,
} from '@/database/schema';
import { AssociateMovementTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';

@Injectable()
export class AssociateAccountsMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async create(
    userId: string,
    dto: any,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    try {
      return await db.transaction(async (tx) => {
        const {
          associateAccountId,
          movementType,
          amount,
          currencyCode,
          transactionDate,
          description,
          referenceId,
          referenceType,
          status,
        } = dto;

        const account = await tx
          .select({
            id: associateAccounts.id,
            balance: associateAccounts.balance,
          })
          .from(associateAccounts)
          .innerJoin(
            associates,
            eq(associateAccounts.associateId, associates.id),
          )
          .where(
            and(
              eq(associateAccounts.id, associateAccountId),
              eq(associates.tenantId, tenantId),
            ),
          );

        if (account.length === 0) {
          throw new NotFoundException(
            `Cuenta de asociado con ID ${associateAccountId} no encontrada.`,
          );
        }

        const internalCode = await this.generateCodeService.generateNextReference(
          'MS',
          tenantId,
          'savings',
          'movements',
          tx,
        );

        const [newMovement] = await tx
          .insert(associateAccountMovements)
          .values({
            associateAccountId,
            movementType: movementType as AssociateMovementTypeEnum,
            amount: amount.toString(),
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate: transactionDate
              ? new Date(transactionDate)
              : new Date(),
            description,
            referenceId,
            referenceType,
            internalCode,
            createdById: userId,
            status: status ?? 'COMPLETED',
          })
          .returning({
            id: associateAccountMovements.id,
            internalCode: associateAccountMovements.internalCode,
          });

        if (!newMovement?.id) {
          throw new InternalServerErrorException(
            'Error al guardar el movimiento.',
          );
        }

        await tx.insert(associateAccountBalanceHistory).values({
          associateAccountId,
          balanceDate: new Date(),
          balance: account[0].balance,
          movementId: newMovement.id,
          reason: `Registro de movimiento: ${movementType}`,
          createdById: userId,
        });

        return {
          message: 'Movimiento registrado exitosamente',
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

  async findAllHaberesByAssociate(
    associateId: string,
    filtersDto: any,
    tenantId: string,
  ) {
    const { page = 1, limit = 10 } = filtersDto;

    const accounts = await this.drizzle
      .select({ id: associateAccounts.id })
      .from(associateAccounts)
      .innerJoin(associates, eq(associateAccounts.associateId, associates.id))
      .where(
        and(eq(associates.id, associateId), eq(associates.tenantId, tenantId)),
      );

    if (!accounts.length) {
      return {
        data: [],
        meta: {
          totalCount: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      };
    }

    const accountIds = accounts.map((acc) => acc.id);

    const haberesTypes = [
      'SAVING_CONTRIBUTION',
      'EMPLOYER_CONTRIBUTION',
      'VOLUNTARY_SAVINGS',
      'DIVIDEND_CREDIT',
    ] as const;

    const whereCondition = and(
      inArray(associateAccountMovements.associateAccountId, accountIds),
      inArray(associateAccountMovements.movementType, [...haberesTypes]),
      eq(associateAccountMovements.status, 'COMPLETED'),
    );

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(associateAccountMovements)
      .where(whereCondition);

    const totalCount = totalCountResult[0].count;

    const movements = await this.drizzle
      .select({
        fecha: associateAccountMovements.transactionDate,
        concepto: associateAccountMovements.description,
        tipo: associateAccountMovements.movementType,
        monto: associateAccountMovements.amount,
      })
      .from(associateAccountMovements)
      .where(whereCondition)
      .orderBy(desc(associateAccountMovements.transactionDate))
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedMovements = movements.map((m) => ({
      ...m,
      monto: parseFloat(m.monto).toFixed(2),
    }));

    return {
      data: formattedMovements,
      meta: {
        totalCount: Number(totalCount),
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findAllByAssociate(
    associateId: string,
    filtersDto: any,
    tenantId: string,
  ) {
    const { page = 1, limit = 10 } = filtersDto;

    const accounts = await this.drizzle
      .select({ id: associateAccounts.id })
      .from(associateAccounts)
      .innerJoin(associates, eq(associateAccounts.associateId, associates.id))
      .where(
        and(eq(associates.id, associateId), eq(associates.tenantId, tenantId)),
      );

    if (!accounts.length) {
      return {
        data: [],
        meta: {
          totalCount: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      };
    }

    const accountIds = accounts.map((acc) => acc.id);

    const whereCondition = and(
      inArray(associateAccountMovements.associateAccountId, accountIds),
    );

    const totalCountResult = await this.drizzle
      .select({ total: sql<number>`count(*)` })
      .from(associateAccountMovements)
      .where(whereCondition);

    const totalCount = Number(totalCountResult[0].total);

    const movements = await this.drizzle
      .select({
        tipo: associateAccountMovements.movementType,
        monto: associateAccountMovements.amount,
        fecha: associateAccountMovements.transactionDate,
        descripcion: associateAccountMovements.description,
        numeroReferencia: associateAccountMovements.internalCode,
        status: associateAccountMovements.status,
      })
      .from(associateAccountMovements)
      .where(whereCondition)
      .orderBy(desc(associateAccountMovements.transactionDate))
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedMovements = movements.map((m) => ({
      ...m,
      monto: parseFloat(m.monto).toFixed(2),
    }));

    return {
      data: formattedMovements,
      meta: {
        totalCount: Number(totalCount),
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
