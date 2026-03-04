import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { CurrencyCodeEnum, entryStatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, lte, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountPlanService } from '../account-plan/account-plan.service';
import { AccountingCyclesService } from '../accounting-cycles/accounting-cycles.service';
import { CreateAccountingEntryDetailDto } from './dto/create-accounting-entry-detail.dto';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { FilterAccountingEntryDto } from './dto/filter-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';
import { AccountingEntryDetail } from './entities/accounting-entry-detail.entity';
import { AccountingEntry } from './entities/accounting-entry.entity';

const SORTABLE_FIELDS = ['entryDate', 'id', 'description'] as const;

@Injectable()
export class AccountingEntriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountingCyclesService: AccountingCyclesService,
    private readonly accountPlanService: AccountPlanService,
  ) {}

  /* ---------- Listado paginado (CORREGIDO - Estrategia 2 Consultas) ---------- */
  async findAllPaginated(dto: FilterAccountingEntryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      accountingCycleId,
      originType,
      originReferenceId,
      startDate,
      endDate,
      accountPlanId,
      sortBy = 'entryDate',
      sortOrder = 'desc',
    } = dto;

    if (!SORTABLE_FIELDS.includes(sortBy as any))
      throw new BadRequestException(`Campo de orden no válido: ${sortBy}`);

    const offset = (page - 1) * limit;
    const conds: SQL[] = [];

    // --- (Filtros de la cabecera del asiento)
    if (search)
      conds.push(ilike(schema.accountingEntries.description, `%${search}%`));
    if (status) conds.push(eq(schema.accountingEntries.status, status));
    if (accountingCycleId)
      conds.push(
        eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
      );
    if (originType)
      conds.push(eq(schema.accountingEntries.originType, originType));
    if (originReferenceId)
      conds.push(
        eq(schema.accountingEntries.originReferenceId, originReferenceId),
      );
    if (startDate)
      conds.push(
        gte(
          schema.accountingEntries.entryDate,
          startDate.toISOString().split('T')[0],
        ),
      );
    if (endDate)
      conds.push(
        lte(
          schema.accountingEntries.entryDate,
          endDate.toISOString().split('T')[0],
        ),
      );

    // --- (Filtro por cuenta contable usando subconsulta IN)
    if (accountPlanId) {
      const sub = this.drizzle
        .select({ entryId: schema.accountingEntryDetails.accountingEntryId })
        .from(schema.accountingEntryDetails)
        .where(eq(schema.accountingEntryDetails.accountPlanId, accountPlanId));
      conds.push(inArray(schema.accountingEntries.id, sub));
    }

    const where = conds.length ? and(...conds) : undefined;

    // 1. Conteo total (Se mantiene igual)
    const [{ count }] = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(where);

    // 2. Consulta de cabeceras (Solo la tabla principal, sin JOIN)
    const entryRows = await this.drizzle
      .select()
      .from(schema.accountingEntries)
      .where(where)
      .orderBy(
        sql`${schema.accountingEntries[sortBy]} ${sortOrder === 'asc' ? sql`asc` : sql`desc`}`,
      )
      .limit(limit)
      .offset(offset);

    // Si no hay asientos, devolvemos el resultado inmediatamente
    if (entryRows.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          totalCount: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
          hasNextPage: false,
          hasPreviousPage: page > 1,
        },
      };
    }

    // 3. Extraer IDs de los asientos
    const entryIds = entryRows.map((entry) => entry.id);

    // Formatear voucherNo con ceros a la izquierda (8 dígitos)
    const formatVoucherNo = (no: number | null) =>
      no ? no.toString().padStart(8, '0') : null;

    // 4. Consulta de detalles (Consulta separada usando inArray)
    const detailRowsRaw = await this.drizzle
      .select({
        id: schema.accountingEntryDetails.id,
        accountingEntryId: schema.accountingEntryDetails.accountingEntryId,
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        associateId: schema.accountingEntryDetails.associateId,
        supplierId: schema.accountingEntryDetails.supplierId,
        debit: schema.accountingEntryDetails.debit,
        credit: schema.accountingEntryDetails.credit,
        description: schema.accountingEntryDetails.description,
        createdAt: schema.accountingEntryDetails.createdAt,
        updatedAt: schema.accountingEntryDetails.updatedAt,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        associateCedula: schema.associates.cedula,
      })
      .from(schema.accountingEntryDetails)
      .leftJoin(
        schema.accountPlan,
        eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
      )
      .leftJoin(
        schema.associates,
        eq(schema.accountingEntryDetails.associateId, schema.associates.id),
      )
      .where(
        inArray(schema.accountingEntryDetails.accountingEntryId, entryIds),
      );

    // 5. Crear mapa de detalles para un mapeo eficiente (Map<entryId, detail[]>)
    const detailsMap = new Map<number, any[]>();
    detailRowsRaw.forEach((row) => {
      const entryId = row.accountingEntryId;
      if (!detailsMap.has(entryId)) {
        detailsMap.set(entryId, []);
      }
      detailsMap.get(entryId)!.push({
        ...row,
        account: {
            code:row.associateCedula
                  ? `${row.accountCode}.${row.associateCedula}` : row.accountCode
        },
      });
    });

    // 6. Mapeo final: Combinar cabeceras y detalles
    const data = entryRows.map((entry) => {
      const details = detailsMap.get(entry.id) || [];

      // Aplicar las conversiones de tipo y fechas al objeto de entrada
      return {
        id: entry.id,
        companyId: entry.companyId,
        accountingCycleId: entry.accountingCycleId,
        description: entry.description,
        voucherNo: entry.voucherNo
          ? entry.voucherNo.toString().padStart(8, '0')
          : undefined,
        entryDate: new Date(entry.entryDate),
        postedAt: entry.postedAt ? new Date(entry.postedAt) : undefined,
        originReferenceId: entry.originReferenceId || undefined,
        originType: entry.originType || undefined,
        currencyCode: entry.currencyCode as CurrencyCodeEnum,
        status: entry.status as entryStatusEnum,
        // Adjuntamos el array de detalles
        details: details as AccountingEntryDetail[],
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalCount: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
        hasNextPage: page < Math.ceil(Number(count) / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /* ---------- Ver uno ---------- */
  async findOne(id: number): Promise<AccountingEntry> {
    const [row] = await this.drizzle
      .select()
      .from(schema.accountingEntries)
      .where(eq(schema.accountingEntries.id, id));

    if (!row) throw new NotFoundException(`Asiento ${id} no encontrado.`);

    const rows_details = await this.drizzle
      .select({
        id: schema.accountingEntryDetails.id,
        accountingEntryId: schema.accountingEntryDetails.accountingEntryId,
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        associateId: schema.accountingEntryDetails.associateId,
        supplierId: schema.accountingEntryDetails.supplierId,
        debit: schema.accountingEntryDetails.debit,
        credit: schema.accountingEntryDetails.credit,
        description: schema.accountingEntryDetails.description,
        createdAt: schema.accountingEntryDetails.createdAt,
        updatedAt: schema.accountingEntryDetails.updatedAt,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        associateCedula: schema.associates.cedula,
      })
      .from(schema.accountingEntryDetails)
      .leftJoin(
        schema.accountPlan,
        eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
      )
      .leftJoin(
        schema.associates,
        eq(schema.accountingEntryDetails.associateId, schema.associates.id),
      )
      .where(eq(schema.accountingEntryDetails.accountingEntryId, id));

    const details = rows_details.map((d) => ({
      ...d,
      account: {
      code: d.associateCedula
                  ? `${d.accountCode}.${d.associateCedula}` : d.accountCode
      },
    }));

    return {
      ...row,
      voucherNo: row.voucherNo ? row.voucherNo.toString().padStart(8, '0') : undefined,
      entryDate: new Date(row.entryDate),
      postedAt: row.postedAt ? new Date(row.postedAt) : undefined,
      currencyCode: row.currencyCode as CurrencyCodeEnum,
      status: row.status as entryStatusEnum,
      details: details as any[],
      originReferenceId: row.originReferenceId || undefined,
      originType: row.originType || undefined,
      updatedAt: row.updatedAt || undefined,
      createdById: row.createdById || undefined,
      updatedById: row.updatedById || undefined,
    };
  }

  /* ---------- Actualizar ---------- */
  async update(
    userId: number,
    id: number,
    dto: UpdateAccountingEntryDto,
  ): Promise<AccountingEntry> {
    const existing = await this.findOne(id);
    if (existing.status !== entryStatusEnum.DRAFT)
      throw new BadRequestException('Solo se puede editar en Borrador.');

    // Si no envía details, mantén los existentes; si envía, úsalos
    /* ---------- normaliza SIEMPRE un array válido ---------- */
    const details: CreateAccountingEntryDetailDto[] =
      (dto.details
        ? dto.details.map((d) => ({
            accountPlanId: d.accountPlanId!, // ❗garantizamos existencia previa
            debit: Number(d.debit),
            credit: Number(d.credit),
            description: d.description,
          }))
        : existing.details?.map((d) => ({
            accountPlanId: d.accountPlanId,
            debit: Number(d.debit),
            credit: Number(d.credit),
            description: d.description,
          }))) ?? [];

    const merged: CreateAccountingEntryDto = {
      companyId: existing.companyId,
      accountingCycleId: existing.accountingCycleId,
      entryDate: dto.entryDate || existing.entryDate,
      description: dto.description || existing.description,
      originReferenceId: dto.originReferenceId ?? existing.originReferenceId,
      originType: dto.originType ?? existing.originType,
      currencyCode: dto.currencyCode || existing.currencyCode,
      details,
    };
    await this.validateAccountingEntry(
      merged.companyId,
      merged.accountingCycleId,
      merged.entryDate,
      merged.details,
    );

    return this.drizzle.transaction(async (tx) => {
      await tx
        .update(schema.accountingEntries)
        .set({
          ...dto,
          entryDate: merged.entryDate.toISOString().split('T')[0],
          updatedById: userId,
        })
        .where(eq(schema.accountingEntries.id, id));

      if (dto.details) {
        await tx
          .delete(schema.accountingEntryDetails)
          .where(eq(schema.accountingEntryDetails.accountingEntryId, id));
        // 🔧 Construimos objetos limpios y obligatorios
        const cleanDetails: (typeof schema.accountingEntryDetails.$inferInsert)[] =
          details.map((d) => ({
            accountingEntryId: id,
            accountPlanId: d.accountPlanId,
            debit: d.debit.toString(),
            credit: d.credit.toString(),
            description: d.description,
          }));
        await tx.insert(schema.accountingEntryDetails).values(cleanDetails);
      }

      return this.findOne(id);
    });
  }

  /* ---------- Eliminar ---------- */
  async remove(id: number): Promise<{ message: string }> {
    const existing = await this.findOne(id);
    if (existing.status !== entryStatusEnum.DRAFT)
      throw new BadRequestException('Solo se puede eliminar en Borrador.');
    await this.drizzle
      .delete(schema.accountingEntries)
      .where(eq(schema.accountingEntries.id, id));
    return { message: 'Asiento eliminado exitosamente.' };
  }

  /* ---------- Validaciones comunes ---------- */
  private async findActiveCycle(companyId: number, date: Date) {
    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: and(
        eq(schema.accountingCycles.companyId, companyId),
        eq(schema.accountingCycles.status, 'OPEN'),
        lte(
          schema.accountingCycles.startDate,
          date.toISOString().split('T')[0],
        ),
        gte(schema.accountingCycles.endDate, date.toISOString().split('T')[0]),
      ),
    });

    if (!cycle) {
      throw new BadRequestException(
        'No se encontró un ciclo contable abierto para la fecha indicada.',
      );
    }
    return cycle;
  }

  private async validateAccountingEntry(
    companyId: number,
    accountingCycleId: number,
    entryDate: Date,
    details: CreateAccountingEntryDetailDto[],
  ) {
    const cycle = await this.accountingCyclesService.findOne(accountingCycleId);
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('El ciclo contable debe estar abierto.');

    const ed = new Date(entryDate);
    if (ed < new Date(cycle.startDate) || ed > new Date(cycle.endDate))
      throw new BadRequestException(
        'La fecha del asiento está fuera del ciclo.',
      );

    if (!details?.length || details.length < 2)
      throw new BadRequestException(
        'El asiento debe tener al menos dos líneas.',
      );

    const ids = details.map((d) => d.accountPlanId);
    const accounts = await this.drizzle
      .select()
      .from(schema.accountPlan)
      .where(inArray(schema.accountPlan.id, ids));

    const map = new Map(accounts.map((a) => [a.id, a]));
    let totalDebit = 0;
    let totalCredit = 0;

    for (const d of details) {
      const acc = map.get(d.accountPlanId);
      if (!acc)
        throw new BadRequestException(`Cuenta ${d.accountPlanId} no existe.`);
      if (!acc.allowsMovements)
        throw new BadRequestException(
          `Cuenta ${acc.code} no admite movimientos.`,
        );

      const deb = Number(d.debit);
      const cr = Number(d.credit);
      if ((deb > 0 && cr > 0) || (deb === 0 && cr === 0))
        throw new BadRequestException(
          'Cada línea debe tener débito O crédito.',
        );

      totalDebit += deb;
      totalCredit += cr;
    }

    // Usar una epsilon para comparaciones de punto flotante si es necesario,
    // pero aquí estamos con Numbers. Lo ideal es usar un redondeo a 2 o 6 decimales.
    if (Math.abs(totalDebit - totalCredit) > 0.000001)
      throw new BadRequestException('El asiento no está cuadrado.');
    if (totalDebit === 0)
      throw new BadRequestException('El asiento no puede ser cero.');
  }

  /* ---------- Crear ---------- */
  async create(
    userId: number,
    dto: CreateAccountingEntryDto,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<AccountingEntry> {
    await this.validateAccountingEntry(
      dto.companyId,
      dto.accountingCycleId,
      dto.entryDate,
      dto.details,
    );

    const db = tx ?? this.drizzle;

    return db.transaction(async (tx) => {
      // Obtener y actualizar el siguiente número de comprobante
      const voucherNo = await this.getNextVoucherNo(tx);

      const [entry] = await tx
        .insert(schema.accountingEntries)
        .values({
          ...dto,
          voucherNo,
          entryDate: dto.entryDate.toISOString().split('T')[0],
          status: 'DRAFT',
          createdById: userId,
        })
        .returning();

      const details = dto.details.map((d) => ({
        ...d,
        description: d.description || dto.description,
        accountingEntryId: entry.id,
        debit: d.debit.toString(),
        credit: d.credit.toString(),
        createdById: userId,
      }));

      await tx.insert(schema.accountingEntryDetails).values(details);

      const entryFormat = {
        ...entry,
        voucherNo: entry.voucherNo ? entry.voucherNo.toString().padStart(8, '0') : undefined,
        entryDate: new Date(entry.entryDate),
        postedAt: entry.postedAt ? new Date(entry.postedAt) : undefined,
      };

      return { ...entryFormat, details } as AccountingEntry;
    });
  }

  /* ---------- Crear Asiento Automático ---------- */
  async createAutomaticEntry(
    userId: number,
    params: {
      companyId: number;
      category: string;
      operationType: string;
      referenceValue?: string;
      description: string;
      entryDate: Date;
      currencyCode: CurrencyCodeEnum;
      originReferenceId?: string;
      originType?: string;
      globalDescriptions?: Record<string, string>;
      items: {
        associateId?: number;
        supplierId?: number;
        amounts: Record<string, number>;
        description?: string;
        descriptions?: Record<string, string>;
      }[];
    },
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<AccountingEntry | null> {
    const db = tx ?? this.drizzle;
    const [setting] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'ASIENTOS_AUTOMATICOS'));

    if (!setting || setting.value !== 'SI') return null;

    const rows = await db
      .select()
      .from(schema.accountingRules)
      .leftJoin(
        schema.accountingRuleDetails,
        eq(schema.accountingRules.id, schema.accountingRuleDetails.ruleId),
      )
      .where(
        and(
          eq(schema.accountingRules.companyId, params.companyId),
          eq(schema.accountingRules.category, params.category),
          eq(schema.accountingRules.operationType, params.operationType),
          params.referenceValue
            ? eq(schema.accountingRules.referenceValue, params.referenceValue)
            : undefined,
          eq(schema.accountingRules.isActive, true),
        ),
      );

    if (rows.length === 0) {
      throw new BadRequestException(
        `No existe una regla contable configurada para: ${params.category} / ${params.operationType}${params.referenceValue ? ` (Ref: ${params.referenceValue})` : ''}`,
      );
    }

    const cycle = await this.findActiveCycle(params.companyId, params.entryDate);
    const ruleDetails = rows
      .map((row) => row.accounting_rule_details)
      .filter((detail) => detail !== null);

    const aggregatedDetails = new Map<string, any>();

    for (const item of params.items) {
      for (const ruleDetail of ruleDetails) {
        if (!ruleDetail?.accountRole) continue;
        const amount = item.amounts[ruleDetail.accountRole];
        if (amount === undefined || amount === 0) continue;

        const isDebit = ruleDetail.movementType === 'DEBIT';
        const associateId = ruleDetail.isAuxiliary ? item.associateId : undefined;
        const supplierId = ruleDetail.isAuxiliarySupplier ? item.supplierId : undefined;

        const description = (associateId || supplierId)
          ? (item.descriptions?.[ruleDetail.accountRole] || item.description || params.description)
          : (params.globalDescriptions?.[ruleDetail.accountRole] || item.description || params.description);

        const key = `${ruleDetail.accountPlanId}-${associateId || 'null'}-${supplierId || 'null'}-${description}`;

        if (aggregatedDetails.has(key)) {
          const existing = aggregatedDetails.get(key);
          existing.debit += isDebit ? amount : 0;
          existing.credit += !isDebit ? amount : 0;
        } else {
          aggregatedDetails.set(key, {
            accountPlanId: ruleDetail.accountPlanId,
            debit: isDebit ? amount : 0,
            credit: !isDebit ? amount : 0,
            description,
            associateId,
            supplierId,
          });
        }
      }
    }

    const detailsDraft: CreateAccountingEntryDetailDto[] = Array.from(aggregatedDetails.values());

    await this.validateAccountingEntry(params.companyId, cycle.id, params.entryDate, detailsDraft);

    const voucherNo = await this.getNextVoucherNo(db);
    const [entry] = await db
      .insert(schema.accountingEntries)
      .values({
        companyId: params.companyId,
        accountingCycleId: cycle.id,
        entryDate: params.entryDate.toISOString().split('T')[0],
        description: params.description,
        voucherNo,
        originReferenceId: params.originReferenceId,
        originType: params.originType || params.operationType,
        currencyCode: params.currencyCode,
        status: 'POSTED',
        postedAt: new Date(),
        createdById: userId,
      })
      .returning();

    const details = detailsDraft.map((d) => ({
      ...d,
      accountingEntryId: entry.id,
      debit: d.debit.toString(),
      credit: d.credit.toString(),
      createdById: userId,
    }));

    await db.insert(schema.accountingEntryDetails).values(details);

    return {
      ...entry,
      voucherNo: entry.voucherNo ? entry.voucherNo.toString().padStart(8, '0') : undefined,
      entryDate: new Date(entry.entryDate),
      postedAt: entry.postedAt ? new Date(entry.postedAt) : undefined,
      details,
    } as AccountingEntry;
  }

  /* ---------- Pasar a PENDIENTE ---------- */
  async submitEntry(userId: number, id: number): Promise<AccountingEntry> {
    const existing = await this.findOne(id);
    if (existing.status !== entryStatusEnum.DRAFT)
      throw new BadRequestException('Solo se puede someter en Borrador.');

    // ❗ Garantiza array
    if (!existing.details?.length)
      throw new BadRequestException(
        'El asiento debe tener al menos dos líneas.',
      );
    const toValidate: CreateAccountingEntryDto = {
      companyId: existing.companyId,
      accountingCycleId: existing.accountingCycleId,
      entryDate: existing.entryDate,
      description: existing.description,
      originReferenceId: existing.originReferenceId || undefined,
      originType: existing.originType || undefined,
      currencyCode: existing.currencyCode,
      details: existing.details?.map((d) => ({
        accountPlanId: d.accountPlanId,
        debit: Number(d.debit),
        credit: Number(d.credit),
        description: d.description,
      })),
    };
    await this.validateAccountingEntry(
      toValidate.companyId,
      toValidate.accountingCycleId,
      toValidate.entryDate,
      toValidate.details,
    );

    await this.drizzle
      .update(schema.accountingEntries)
      .set({ status: entryStatusEnum.PENDING, updatedById: userId })
      .where(eq(schema.accountingEntries.id, id));

    return this.findOne(id);
  }

  /* ---------- Contabilizar (POSTED) ---------- */
  async postEntry(userId: number, id: number): Promise<AccountingEntry> {
    const existing = await this.findOne(id);
    if (existing.status !== entryStatusEnum.PENDING)
      throw new BadRequestException('Solo se puede contabilizar en Pendiente.');

    const cycle = await this.accountingCyclesService.findOne(
      existing.accountingCycleId,
    );
    if (cycle.status !== 'OPEN')
      throw new BadRequestException('El ciclo contable está cerrado.');

    await this.drizzle
      .update(schema.accountingEntries)
      .set({
        status: entryStatusEnum.POSTED,
        postedAt: new Date(),
        updatedById: userId,
      })
      .where(
        and(
          eq(schema.accountingEntries.id, id),
          eq(schema.accountingEntries.status, entryStatusEnum.PENDING),
        ),
      );

    return this.findOne(id);
  }

  /* ---------- Anular (CANCELLED) ---------- */
  async cancelEntry(userId: number, id: number): Promise<AccountingEntry> {
    const original = await this.findOne(id);
    if (original.status !== entryStatusEnum.POSTED)
      throw new BadRequestException(
        'Solo se puede anular un asiento CONTABILIZADO.',
      );

    const cycle = await this.accountingCyclesService.findOne(
      original.accountingCycleId,
    );
    if (cycle.status !== 'OPEN')
      throw new BadRequestException('El ciclo contable está cerrado.');

    return this.drizzle.transaction(async (tx) => {
      if (!original.details?.length)
        throw new BadRequestException(
          'El asiento no tiene líneas para revertir.',
        );
      // 1. Crear asiento reverso
      const reversal: CreateAccountingEntryDto = {
        companyId: original.companyId,
        accountingCycleId: original.accountingCycleId,
        entryDate: new Date(),
        description: `ANULACIÓN: ${original.description}`,
        originReferenceId: original.id?.toString(),
        originType: 'REVERSAL',
        currencyCode: original.currencyCode,
        details: original.details?.map((d) => ({
          accountPlanId: d.accountPlanId,
          debit: Number(d.credit),
          credit: Number(d.debit),
          description: `Reversión de ${d.description || ''}`,
        })),
      };
      await this.create(userId, reversal);

      // 2. Marcar original como CANCELLED
      await tx
        .update(schema.accountingEntries)
        .set({ status: entryStatusEnum.CANCELLED, updatedById: userId })
        .where(eq(schema.accountingEntries.id, id));

      return this.findOne(id);
    });
  }

  //extras

  /* POST /api/entries/validate  (body = CreateAccountingEntryDto) */
  async validateDto(dto: CreateAccountingEntryDto): Promise<{
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
    lines: number;
  }> {
    await this.validateAccountingEntry(
      dto.companyId,
      dto.accountingCycleId,
      dto.entryDate,
      dto.details,
    ); // lanza si hay error
    const totals = dto.details.reduce(
      (acc, l) => {
        acc.debit += Number(l.debit);
        acc.credit += Number(l.credit);
        return acc;
      },
      { debit: 0, credit: 0 },
    );
    return {
      totalDebit: totals.debit,
      totalCredit: totals.credit,
      balanced: totals.debit === totals.credit,
      lines: dto.details.length,
    };
  }

  /* GET /api/entries/totals?start=2025-01-01&end=2025-01-31 */
  async getTotals(
    companyId: number,
    start: Date,
    end: Date,
  ): Promise<{ totalDebit: number; totalCredit: number }> {
    const [row] = await this.drizzle
      .select({
        totalDebit: sql<number>`sum(${schema.accountingEntryDetails.debit})`,
        totalCredit: sql<number>`sum(${schema.accountingEntryDetails.credit})`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        eq(
          schema.accountingEntries.id,
          schema.accountingEntryDetails.accountingEntryId,
        ),
      )
      .where(
        and(
          eq(schema.accountingEntries.companyId, companyId),
          eq(schema.accountingEntries.status, 'POSTED'),
          gte(
            schema.accountingEntries.entryDate,
            start.toISOString().split('T')[0],
          ),
          lte(
            schema.accountingEntries.entryDate,
            end.toISOString().split('T')[0],
          ),
        ),
      );

    return {
      totalDebit: row.totalDebit ?? 0,
      totalCredit: row.totalCredit ?? 0,
    };
  }

  /* POST /api/entries/generate-opening
   body = { accountingCycleId, entryDate, balances: [{accountPlanId, amount}] } */
  async generateOpening(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      balances: { accountPlanId: number; amount: number }[];
    },
  ): Promise<AccountingEntry> {
    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado o inexistente.');

    const capitalAcc = await this.drizzle
      .select()
      .from(schema.accountPlan)
      .where(
        and(
          eq(schema.accountPlan.code, '3.1.01.001'),
          eq(schema.accountPlan.companyId, cycle.companyId),
        ),
      )
      .limit(1);

    if (!capitalAcc.length)
      throw new BadRequestException(
        'No existe cuenta de capital (3.1.01.001).',
      );

    const details: CreateAccountingEntryDetailDto[] = [
      ...dto.balances.map((b) => ({
        accountPlanId: b.accountPlanId,
        debit: b.amount,
        credit: 0,
        description: 'Saldo inicial según inventario',
      })),
      {
        accountPlanId: capitalAcc[0].id,
        debit: 0,
        credit: dto.balances.reduce((sum, b) => sum + b.amount, 0),
        description: 'Capital inicial',
      },
    ];

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Asiento de apertura',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }

  /* POST /api/entries/close-month
   body = { accountingCycleId, entryDate, resultAccountId } */
  async closeMonth(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      resultAccountId: number;
    },
  ): Promise<AccountingEntry> {
    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado o inexistente.');

    // 1. Obtener saldos de cuentas de resultado (4- y 5-) del ciclo
    const result = await this.drizzle
      .select({
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        nature: schema.accountPlan.nature,
        totalDebit: sql<number>`sum(${schema.accountingEntryDetails.debit})`,
        totalCredit: sql<number>`sum(${schema.accountingEntryDetails.credit})`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        eq(
          schema.accountingEntries.id,
          schema.accountingEntryDetails.accountingEntryId,
        ),
      )
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountPlan.id, schema.accountingEntryDetails.accountPlanId),
      )
      .where(
        and(
          eq(schema.accountingEntries.companyId, cycle.companyId),
          eq(schema.accountingEntries.accountingCycleId, dto.accountingCycleId),
          eq(schema.accountingEntries.status, 'POSTED'),
          inArray(schema.accountPlan.accountType, ['REVENUE', 'EXPENSE']),
        ),
      )
      .groupBy(
        schema.accountingEntryDetails.accountPlanId,
        schema.accountPlan.nature,
      );

    if (!result.length)
      throw new BadRequestException('No hay cuentas de resultado para cerrar.');

    // 2. Detalle: vaciar cada cuenta al resultado
    const details: CreateAccountingEntryDetailDto[] = [];
    let resultDebit = 0;
    let resultCredit = 0;

    for (const r of result) {
      const bal = (r.totalDebit ?? 0) - (r.totalCredit ?? 0);
      if (bal === 0) continue;
      if (r.nature === 'DEBIT') {
        details.push({
          accountPlanId: r.accountPlanId,
          debit: 0,
          credit: Math.abs(bal),
          description: 'Cierre de resultado',
        });
        if (bal > 0) resultCredit += bal;
        else resultDebit += Math.abs(bal);
      } else {
        details.push({
          accountPlanId: r.accountPlanId,
          debit: Math.abs(bal),
          credit: 0,
          description: 'Cierre de resultado',
        });
        if (bal > 0) resultDebit += bal;
        else resultCredit += Math.abs(bal);
      }
    }

    // 3. Contrapartida en cuenta de resultado
    const finalBal = resultDebit - resultCredit;
    details.push({
      accountPlanId: dto.resultAccountId,
      debit: finalBal < 0 ? Math.abs(finalBal) : 0,
      credit: finalBal > 0 ? finalBal : 0,
      description: 'Resultado del ejercicio',
    });

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Cierre de resultado',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }

  /* POST /api/entries/depreciation
   body = { accountingCycleId, entryDate, lines:[{assetAccountId, expenseAccountId, amount}] } */
  async depreciate(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      lines: {
        assetAccountId: number;
        expenseAccountId: number;
        amount: number;
      }[];
    },
  ): Promise<AccountingEntry> {
    if (!dto.lines.length)
      throw new BadRequestException('No hay montos a depreciar.');

    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado.');

    const details: CreateAccountingEntryDetailDto[] = dto.lines.flatMap((l) => [
      {
        accountPlanId: l.expenseAccountId,
        debit: l.amount,
        credit: 0,
        description: 'Depreciación del mes',
      },
      {
        accountPlanId: l.assetAccountId,
        debit: 0,
        credit: l.amount,
        description: 'Depreciación acumulada',
      },
    ]);

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Asiento de depreciación',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }

  /* POST /api/entries/bank-reconciliation
   body = { accountingCycleId, entryDate, items:[{accountId, amount, description}] } */
  async bankReconciliation(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      items: { accountId: number; amount: number; description?: string }[];
    },
  ): Promise<AccountingEntry> {
    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado.');

    const details: CreateAccountingEntryDetailDto[] = dto.items.map((i) => ({
      accountPlanId: i.accountId,
      debit: i.amount > 0 ? i.amount : 0,
      credit: i.amount < 0 ? Math.abs(i.amount) : 0,
      description: i.description || 'Ajuste por conciliación',
    }));

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Ajustes de conciliación bancaria',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }

  /* POST /api/entries/inventory-adjust
   body = { accountingCycleId, entryDate, items:[{inventoryAccountId, expenseAccountId, qty, cost}] } */
  async inventoryAdjust(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      items: {
        inventoryAccountId: number;
        expenseAccountId: number;
        qty: number;
        unitCost: number;
      }[];
    },
  ): Promise<AccountingEntry> {
    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado.');

    const details: CreateAccountingEntryDetailDto[] = dto.items.flatMap((i) => {
      const total = i.qty * i.unitCost;
      if (total === 0) return [];
      if (total > 0) {
        // Sobrante  inventario ↑
        return [
          {
            accountPlanId: i.inventoryAccountId,
            debit: total,
            credit: 0,
            description: 'Ajuste por inventario (sobrante)',
          },
          {
            accountPlanId: i.expenseAccountId,
            debit: 0,
            credit: total,
            description: 'Ingreso por sobrante',
          },
        ];
      } else {
        // Merma  inventario ↓
        const abs = Math.abs(total);
        return [
          {
            accountPlanId: i.expenseAccountId,
            debit: abs,
            credit: 0,
            description: 'Merma / deterioro',
          },
          {
            accountPlanId: i.inventoryAccountId,
            debit: 0,
            credit: abs,
            description: 'Ajuste por inventario (merma)',
          },
        ];
      }
    });

    if (!details.length)
      throw new BadRequestException('No hay ajustes a registrar.');

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Ajustes de inventario',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }

  /* POST /api/entries/tax-provision
   body = { accountingCycleId, entryDate, items:[{expenseAccountId, taxPayableAccountId, amount}] } */
  async taxProvision(
    userId: number,
    dto: {
      accountingCycleId: number;
      entryDate: Date;
      items: {
        expenseAccountId: number;
        taxPayableAccountId: number;
        amount: number;
      }[];
    },
  ): Promise<AccountingEntry> {
    const cycle = await this.accountingCyclesService.findOne(
      dto.accountingCycleId,
    );
    if (!cycle || cycle.status !== 'OPEN')
      throw new BadRequestException('Ciclo cerrado.');

    const details: CreateAccountingEntryDetailDto[] = dto.items.flatMap((i) => [
      {
        accountPlanId: i.expenseAccountId,
        debit: i.amount,
        credit: 0,
        description: 'Gasto por impuesto',
      },
      {
        accountPlanId: i.taxPayableAccountId,
        debit: 0,
        credit: i.amount,
        description: 'Impuesto por pagar',
      },
    ]);

    return this.create(userId, {
      companyId: cycle.companyId,
      accountingCycleId: dto.accountingCycleId,
      entryDate: dto.entryDate,
      description: 'Provisiones de impuestos',
      currencyCode: 'VES' as CurrencyCodeEnum,
      details,
    });
  }
  /* ---------- Helpers ---------- */
  private async getNextVoucherNo(
    tx: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const [setting] = await tx
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, 'NRO-ASIENTO'));

    if (!setting) {
      // Si no existe, lo creamos con 1
      await tx.insert(schema.systemSettings).values({
        key: 'NRO-ASIENTO',
        value: '1',
        description: 'Último consecutivo Asiento Contable',
        group: 'DOCUMENTS',
      });
      return 1;
    }

    const nextValue = parseInt(setting.value, 10) + 1;

    await tx
      .update(schema.systemSettings)
      .set({ value: nextValue.toString() })
      .where(eq(schema.systemSettings.key, 'NRO-ASIENTO'));

    return nextValue;
  }
}
