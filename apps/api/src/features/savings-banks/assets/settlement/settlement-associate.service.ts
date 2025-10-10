import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  auditLogs,
  liquidationsAssociates,
} from '@/database/index';
import {
  AssociateMovementTypeEnum,
  creditPaymetTypeEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreditPaidService } from '../../credits/credit-paid/credit-paid.service';
import { LoanPaidService } from '../../loans/loan_paid/loan-paid.service';
import { CreateSettlementAssociateDto } from './dto/create-settlement-associate.dto';

@Injectable()
export class SettlementAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly loanPaidService: LoanPaidService,
    private readonly creditPaidService: CreditPaidService,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async findOneRequest(cedula: string) {
    const result = await this.db
      .select()
      .from(associates)
      .where(eq(associates.cedula, cedula));

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (result[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (result[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const resultLiquidations = await this.db.execute(
      sql.raw(
        `select *from savings_banks.calculate_associate_liquidation('${cedula}')`,
      ),
    );

    if (resultLiquidations.rows.length === 0) {
      throw new NotFoundException(
        `Associate with cedula ${cedula} has no liquidation data`,
      );
    }

    const transformResultLiquidations = resultLiquidations.rows.map((row) => ({
      ...row,
      total_savings_balance: Number(row.total_savings_balance).toFixed(2),
      total_outstanding_loans: Number(row.total_outstanding_loans).toFixed(2),
      total_outstanding_credits: Number(row.total_outstanding_credits).toFixed(
        2,
      ),
      net_liquidation_amount: Number(row.net_liquidation_amount).toFixed(2),
    }));

    return {
      message: 'Associate liquidation calculated',
      data: transformResultLiquidations[0],
    };
  }

  /**
   * @description Crea una SOLICITUD de liquidación para un asociado.
   * Esta operación solo registra la solicitud y la deja en estado 'REQUESTED'.
   * La aprobación y el procesamiento se realizan en el método `approve`.
   * @param dto - Datos para la solicitud de liquidación.
   * @param userId - ID del usuario que crea la solicitud.
   * @returns El registro de la liquidación creada.
   */
  async create(dto: CreateSettlementAssociateDto, userId: number) {
    const {
      associateId,
      netLiquidationAmount,
      totalOutstandingCreditsAtLiquidation,
      totalOutstandingLoansAtLiquidation,
      totalSavingsBalanceAtLiquidation,
      liquidationDate,
      notes,
      beneficiary,
    } = dto;

    return this.db.transaction(async (tx) => {
      // 1. Validar que el asociado exista y esté activo
      const [associate] = await tx
        .select({
          id: associates.id,
          cedula: associates.cedula,
          status: associates.status,
        })
        .from(associates)
        .where(eq(associates.id, associateId));

      if (!associate?.id) {
        throw new NotFoundException(`Asociado no encontrado.`);
      }

      if (associate.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El asociado con cédula '${associate.cedula}' no está activo para ser liquidado (estado actual: ${associate.status}).`,
        );
      }

      // 2. Verificar si ya existe una solicitud pendiente para este asociado
      const [existingLiquidation] = await tx
        .select()
        .from(liquidationsAssociates)
        .where(
          and(
            eq(liquidationsAssociates.associateId, associateId),
            eq(liquidationsAssociates.status, 'REQUESTED'),
          ),
        );

      if (existingLiquidation) {
        throw new BadRequestException(
          `Ya existe una solicitud de liquidación pendiente para este asociado.`,
        );
      }

      // 3. Generar una referencia única para la liquidación
      const reference = await this.generateCodeService.generateNextReference(
        'RH-LIQ',
        tx,
      );

      // 4. Guardar el registro de la liquidación con estado 'REQUESTED'
      const [newLiquidationRequest] = await tx
        .insert(liquidationsAssociates)
        .values({
          associateId: associateId,
          liquidationDate: liquidationDate?.toISOString(),
          currencyCode: 'VES' as CurrencyCodeEnum,
          totalSavingsBalanceAtLiquidation: String(
            totalSavingsBalanceAtLiquidation,
          ),
          totalOutstandingLoansAtLiquidation: String(
            totalOutstandingLoansAtLiquidation,
          ),
          totalOutstandingCreditsAtLiquidation: String(
            totalOutstandingCreditsAtLiquidation,
          ),
          netLiquidationAmount: String(netLiquidationAmount),
          status: 'REQUESTED', // Estado inicial de la solicitud
          notes: notes,
          createdById: Number(userId),
          customReference: reference,
          beneficiary: beneficiary ? beneficiary : null,
        })
        .returning({
          id: liquidationsAssociates.id,
          customReference: liquidationsAssociates.customReference,
        });

      // 5. Registrar la acción en el log de auditoría
      await tx.insert(auditLogs).values({
        userId: userId,
        action: 'INSERT',
        tableName: 'liquidationsAssociates',
        recordId: newLiquidationRequest.id.toString(),
        description: `Solicitud de Liquidación de Asociado`,
        area: 'Liquidacion',
        newData: [{ ...dto, status: 'REQUESTED', customReference: reference }],
      });

      return {
        message: `Solicitud de liquidación creada exitosamente.`,
        liquidation: newLiquidationRequest,
      };
    });
  }

  /**
   * @description Aprueba y procesa una solicitud de liquidación existente.
   * Realiza la compensación de deudas, actualiza estados y genera movimientos contables.
   * @param liquidationId - ID de la liquidación a aprobar.
   * @param userId - ID del usuario que aprueba la liquidación.
   * @returns Un mensaje de éxito con el resultado de la operación.
   */
  async approve(liquidationId: number, userId: number) {
    return this.db.transaction(async (tx) => {
      // 1. Obtener la liquidación y validar su estado
      const [liquidation] = await tx
        .select()
        .from(liquidationsAssociates)
        .where(eq(liquidationsAssociates.id, liquidationId));

      if (!liquidation) {
        throw new NotFoundException(
          `Solicitud de liquidación con ID ${liquidationId} no encontrada.`,
        );
      }

      if (liquidation.status !== 'REQUESTED') {
        throw new BadRequestException(
          `La liquidación no está en estado 'SOLICITADO'. Estado actual: ${liquidation.status}.`,
        );
      }

      // 2. Obtener información del asociado
      const [associate] = await tx
        .select({
          id: associates.id,
          cedula: associates.cedula,
          fullname: associates.fullname,
          status: associates.status,
          associateAccountId: associateAccounts.id,
        })
        .from(associates)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associates.id),
        )
        .where(eq(associates.id, liquidation.associateId));

      if (!associate?.id) {
        throw new NotFoundException(
          `Asociado no encontrado para esta liquidación.`,
        );
      }

      const {
        totalOutstandingCreditsAtLiquidation,
        totalOutstandingLoansAtLiquidation,
        netLiquidationAmount,
        liquidationDate,
      } = liquidation;

      // 3. Compensación de Deudas (Créditos y Préstamos)
      // NOTA: Se asume 'SETTLEMENT' como método de pago para estas transacciones internas.
      if (Number(totalOutstandingCreditsAtLiquidation) > 0) {
        const credits = await this.creditPaidService.findOneRequest(
          associate.cedula,
        );
        try {
          await this.creditPaidService.create(
            {
              amount: Number(totalOutstandingCreditsAtLiquidation),
              creditId: credits?.creditId,
              paymentDate: new Date(),
              paymentMethod: 'BANK_TRANSFER' as paymentMethodEnum,
              paymentType: 'PAYING' as creditPaymetTypeEnum,
              comment: 'Pago de Crédito por liquidación de asociado',
              transactionReference: '',
              bankId: undefined,
            },
            userId,
          );
        } catch (error) {
          throw new InternalServerErrorException(
            `No se pudo compensar el crédito durante la liquidación.`,
          );
        }
      }

      if (Number(totalOutstandingLoansAtLiquidation) > 0) {
        const loans = await this.loanPaidService.findOneRequest(
          associate.cedula,
        );
        try {
          await this.loanPaidService.create(
            {
              amount: Number(totalOutstandingLoansAtLiquidation),
              loanId: loans.loanId,
              paymentDate: new Date(),
              paymentMethod: 'BANK_TRANSFER' as paymentMethodEnum,
              paymentType: 'PAYING' as loanPaymetTypeEnum,
              comment: 'Pago de préstamo por liquidación de asociado',
              transactionReference: '',
              bankId: undefined,
            },
            userId,
          );
        } catch (error) {
          throw new InternalServerErrorException(
            `No se pudo compensar el préstamo durante la liquidación.`,
          );
        }
      }

      // 4. Registrar el movimiento de retiro final si el neto es positivo
      if (Number(netLiquidationAmount) > 0) {
        try {
          await this.associateAccountsMovementsService.create(userId, {
            associateAccountId: Number(associate.associateAccountId),
            movementType: 'LIQUIDATION_BALANCE' as AssociateMovementTypeEnum,
            amount: Number(netLiquidationAmount),
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: new Date(),
            description: 'Liquidacion total de Haberes',
            referenceId: String(liquidation.id),
            referenceType: 'liquidationsAssociates',
            referenceNumber: liquidation.customReference ?? undefined,
            area: 'LIQUIDACION',
          });
        } catch (error) {
          throw new InternalServerErrorException(
            `Error al generar el movimiento de la liquidacion.`,
          );
        }
      }

      // 5. Actualizar estado del asociado a "RETIRED"
      await tx
        .update(associates)
        .set({
          status: 'RETIRED',
          dateGraduation: new Date().toISOString(),
          updatedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(associates.id, associate.id));

      // 6. Actualizar estado de la cuenta del asociado a "ARCHIVED"
      await tx
        .update(associateAccounts)
        .set({
          status: 'ARCHIVED',
          closingDate: new Date().toISOString(),
          updatedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(associateAccounts.associateId, associate.id));

      // 7. Actualizar estado de la liquidación a "PROCESSED"
      await tx
        .update(liquidationsAssociates)
        .set({
          status: 'PROCESSED',
          updatedById: userId,
        })
        .where(eq(liquidationsAssociates.id, liquidationId));

      // 8. Registrar la aprobación en el log de auditoría
      await tx.insert(auditLogs).values({
        userId: userId,
        action: 'UPDATE',
        tableName: 'liquidationsAssociates',
        recordId: liquidationId.toString(),
        description: `Procesamiento y Aprobación de Liquidación de Asociado`,
        area: 'Liquidacion',
        newData: [{ ...liquidation, status: 'PROCESSED' }],
      });

      return {
        message: `Liquidación procesada exitosamente para el asociado '${associate.fullname}'.`,
        liquidationId: liquidation.id,
      };
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(associates.cedula, `%${search}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${liquidationsAssociates[sortBy as keyof typeof liquidationsAssociates]} asc`
        : sql`${liquidationsAssociates[sortBy as keyof typeof liquidationsAssociates]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.db
      .select({
        id: liquidationsAssociates.id,
        customReference: liquidationsAssociates.customReference,
        liquidationDate: liquidationsAssociates.liquidationDate,
        totalSavingsBalanceAtLiquidation:
          liquidationsAssociates.totalSavingsBalanceAtLiquidation,
        totalOutstandingLoansAtLiquidation:
          liquidationsAssociates.totalOutstandingLoansAtLiquidation,
        totalOutstandingCreditsAtLiquidation:
          liquidationsAssociates.totalOutstandingCreditsAtLiquidation,
        netLiquidationAmount: liquidationsAssociates.netLiquidationAmount,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        status: liquidationsAssociates.status,
      })
      .from(liquidationsAssociates)
      .where(searchCondition)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data: data.map((item) => ({
        ...item,
        totalSavingsBalanceAtLiquidation: Number(
          item.totalSavingsBalanceAtLiquidation,
        ).toFixed(2),
        totalOutstandingLoansAtLiquidation: Number(
          item.totalOutstandingLoansAtLiquidation,
        ).toFixed(2),
        totalOutstandingCreditsAtLiquidation: Number(
          item.totalOutstandingCreditsAtLiquidation,
        ).toFixed(2),
        netLiquidationAmount: Number(item.netLiquidationAmount).toFixed(2),
      })),
      meta,
    };
  }

  async findSettlementAprovee() {
    const result = await this.db
      .select({
        id: liquidationsAssociates.id,
        associateId: associates.id,
        associateCedula: associates.cedula,
        associateName: associates.fullname,
        reference: liquidationsAssociates.customReference,
        approvalDate: liquidationsAssociates.liquidationDate,
        amount: liquidationsAssociates.netLiquidationAmount,
      })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(eq(liquidationsAssociates.status, 'PROCESSED'));

    return {
      data: result,
    };
  }
}
