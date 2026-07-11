import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { AccountingEntryWithDetails } from '@/database/types/accounting';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { CurrencyCodeEnum, entryStatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, lte, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';
import { AccountingCyclesService } from '../accounting-cycles/accounting-cycles.service';
import { CreateAccountingEntryDetailDto } from './dto/create-accounting-entry-detail.dto';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { FilterAccountingEntryDto } from './dto/filter-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

const SORTABLE_FIELDS = ['entryDate', 'id', 'description'] as const;

@Injectable()
export class AccountingEntriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountingCyclesService: AccountingCyclesService,
    private readonly auditHelper: AuditHelper,
  ) {}

  /* ---------- Listado paginado (CORREGIDO - Estrategia 2 Consultas) ---------- */
  async findAllPaginated(tenantId: string, dto: FilterAccountingEntryDto) {
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
    const conds: SQL[] = [eq(schema.accountingEntries.tenantId, tenantId)];

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

    // ... el resto del método se mantiene, usando el tenantId filtrado ...

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
    const detailsMap = new Map<string, any[]>();
    detailRowsRaw.forEach((row) => {
      const entryId = row.accountingEntryId;
      if (!detailsMap.has(entryId)) {
        detailsMap.set(entryId, []);
      }
      detailsMap.get(entryId)!.push({
        ...row,
        account: {
          code: row.associateCedula
            ? `${row.accountCode}.${row.associateCedula}`
            : row.accountCode,
        },
      });
    });

    // 6. Mapeo final: Combinar cabeceras y detalles
    const data = entryRows.map((entry) => {
      const details = detailsMap.get(entry.id) || [];

      // Aplicar las conversiones de tipo y fechas al objeto de entrada
      return {
        id: entry.id,
        tenantId: entry.tenantId,
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
        details: details as any[],
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
  async findOne(tenantId: string, id: string): Promise<any> {
    const [row] = await this.drizzle
      .select()
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.id, id),
          eq(schema.accountingEntries.tenantId, tenantId),
        ),
      );

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
          ? `${d.accountCode}.${d.associateCedula}`
          : d.accountCode,
      },
    }));

    return {
      ...row,
      voucherNo: row.voucherNo
        ? row.voucherNo.toString().padStart(8, '0')
        : undefined,
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
  /* ---------- Actualizar ---------- */
  async update(
    userId: string,
    tenantId: string,
    id: string,
    dto: UpdateAccountingEntryDto,
  ): Promise<AccountingEntryWithDetails> {
    // 1. Verificar existencia y estado
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== entryStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Solo se puede editar asientos en estado Borrador.',
      );
    }

    // 2. Preparar el merge para la validación de integridad (partida doble)
    // Mapeamos asegurando que los tipos coincidan con lo que espera validateAccountingEntry
    const detailsForValidation = (
      dto.details
        ? dto.details.map((d) => ({
            accountPlanId: d.accountPlanId!,
            debit: Number(d.debit || 0),
            credit: Number(d.credit || 0),
            description: d.description ?? existing.description,
          }))
        : existing.details.map((d) => ({
            accountPlanId: d.accountPlanId,
            debit: Number(d.debit),
            credit: Number(d.credit),
            description: d.description ?? existing.description,
          }))
    ) as any;

    await this.validateAccountingEntry(
      tenantId,
      existing.accountingCycleId,
      dto.entryDate || existing.entryDate,
      detailsForValidation,
    );

    return this.drizzle.transaction(async (tx) => {
      // 3. Actualizar Cabecera
      // Extraemos details para no intentar insertarlos en la tabla padre
      const { details: dtoDetails, ...entryData } = dto;

      await tx
        .update(schema.accountingEntries)
        .set({
          ...entryData,
          entryDate: (dto.entryDate || existing.entryDate)
            .toISOString()
            .split('T')[0],
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.accountingEntries.id, id),
            eq(schema.accountingEntries.tenantId, tenantId),
          ),
        );

      // 4. Si se enviaron nuevos detalles, reemplazamos
      if (dtoDetails) {
        // Borrar antiguos
        await tx
          .delete(schema.accountingEntryDetails)
          .where(eq(schema.accountingEntryDetails.accountingEntryId, id));

        // Insertar nuevos (Aquí es donde faltaba createdById)
        const cleanDetails = dtoDetails.map((d) => ({
          accountingEntryId: id,
          accountPlanId: d.accountPlanId!,
          debit: d.debit?.toString() || '0',
          credit: d.credit?.toString() || '0',
          description: d.description ?? dto.description ?? existing.description,
          associateId: d.associateId ?? null,
          supplierId: d.supplierId ?? null,
          createdById: userId, // 👈 Obligatorio según tu esquema
        }));

        await tx.insert(schema.accountingEntryDetails).values(cleanDetails);
      }

      return this.findOne(tenantId, id);
    });
  }

  /* ---------- Eliminar ---------- */
  async remove(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<{ message: string }> {
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== entryStatusEnum.DRAFT)
      throw new BadRequestException('Solo se puede eliminar en Borrador.');
    await this.drizzle
      .delete(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.id, id),
          eq(schema.accountingEntries.tenantId, tenantId),
        ),
      );
    return { message: 'Asiento eliminado exitosamente.' };
  }

  /* ---------- Validaciones comunes ---------- */
  private async findActiveCycle(tenantId: string, date: Date | string) {
    const dateStr =
      typeof date === 'string'
        ? new Date(date).toISOString().split('T')[0]
        : date.toISOString().split('T')[0];

    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: and(
        eq(schema.accountingCycles.tenantId, tenantId),
        eq(schema.accountingCycles.status, 'OPEN'),
        lte(schema.accountingCycles.startDate, dateStr),
        gte(schema.accountingCycles.endDate, dateStr),
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
    tenantId: string,
    accountingCycleId: string,
    entryDate: Date,
    details: CreateAccountingEntryDetailDto[],
  ) {
    const cycle = await this.accountingCyclesService.findOne(
      tenantId,
      accountingCycleId,
    );
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
    userId: string,
    tenantId: string,
    dto: CreateAccountingEntryDto,
    tx?: NodePgDatabase<typeof schema>,
    initialStatus: entryStatusEnum = entryStatusEnum.DRAFT,
  ) {
    const cycle = await this.findActiveCycle(tenantId, dto.entryDate);

    await this.validateAccountingEntry(
      tenantId,
      cycle.id,
      dto.entryDate,
      dto.details,
    );

    const db = tx ?? this.drizzle;

    return db.transaction(async (tx) => {
      const voucherNo = await this.getNextVoucherNo(tenantId, userId, tx);

      const [entry] = await tx
        .insert(schema.accountingEntries)
        .values({
          tenantId,
          accountingCycleId: cycle.id,
          entryDate: new Date(dto.entryDate).toISOString().split('T')[0],
          description: dto.description,
          currencyCode: dto.currencyCode,
          originReferenceId: dto.originReferenceId ?? null,
          originType: dto.originType ?? null,
          voucherNo,
          status: initialStatus,
          postedAt:
            initialStatus === entryStatusEnum.POSTED ? new Date() : null,
          createdById: userId,
        })
        .returning();

      // 2. Preparar objetos de detalle
      const detailsToInsert = dto.details.map((d) => ({
        ...d,
        description: d.description || dto.description || null,
        accountingEntryId: entry.id,
        debit: d.debit.toString(),
        credit: d.credit.toString(),
        createdById: userId,
        // Manejo explícito de nulos para evitar errores de compatibilidad
        associateId: d.associateId ?? null,
        supplierId: d.supplierId ?? null,
      }));

      // 3. INSERTAR Y CAPTURAR (Esto genera los ids, createdAt, etc.)
      const insertedDetails = await tx
        .insert(schema.accountingEntryDetails)
        .values(detailsToInsert)
        .returning();

      // 4. Formatear la salida para cumplir con AccountingEntryWithDetails
      return {
        ...entry,
        // Drizzle devuelve la fecha como string de la DB, convertimos a Date
        entryDate: entry.entryDate,
        voucherNo: entry.voucherNo?.toString().padStart(8, '0'),
        postedAt: entry.postedAt ? new Date(entry.postedAt) : null,
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : null,
        // Usamos los detalles devueltos por la DB, no los del mapa original
        details: insertedDetails,
      };
    });
  }

  /* ---------- Crear Asiento Automático ---------- */
  async createAutomaticEntry(
    tenantId: string,
    userId: string,
    params: {
      module: string;
      submodule: string;
      category: string;
      operationType: string;
      referenceValue?: string;
      description: string;
      entryDate: Date;
      currencyCode: CurrencyCodeEnum;
      originReferenceId?: string;
      originType?: string;
      globalDescriptions?: Record<string, string>;
      roleAliases?: Record<string, string>;
      items: {
        associateId?: string;
        supplierId?: string;
        amounts: Record<string, number>;
        description?: string;
        descriptions?: Record<string, string>;
      }[];
    },
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<AccountingEntryWithDetails | null> {
    const db = tx ?? this.drizzle;

    const [masterSetting] = await db
      .select()
      .from(schema.tenantSettings)
      .where(
        and(
          eq(schema.tenantSettings.tenantId, tenantId),
          eq(schema.tenantSettings.key, 'ACCOUNTING_AUTO_POSTING_MASTER'),
        ),
      );

    if (!masterSetting || masterSetting.value !== 'true') return null;

    const autoPostKey = `AUTO_POST_ENTRY_${params.submodule.toUpperCase()}`;
    const [moduleSetting] = await db
      .select()
      .from(schema.moduleSettings)
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, params.module),
          eq(schema.moduleSettings.submodule, params.submodule),
          eq(schema.moduleSettings.key, autoPostKey),
        ),
      );

    if (!moduleSetting || moduleSetting.value !== 'true') return null;

    const rows = await db
      .select()
      .from(schema.accountingRules)
      .leftJoin(
        schema.accountingRuleDetails,
        eq(schema.accountingRules.id, schema.accountingRuleDetails.ruleId),
      )
      .where(
        and(
          eq(schema.accountingRules.tenantId, tenantId),
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

    const cycle = await this.findActiveCycle(tenantId, params.entryDate);
    const ruleDetails = rows
      .map((row) => row.accounting_rule_details)
      .filter((detail) => detail !== null);

    const aggregatedDetails = new Map<string, any>();

    for (const item of params.items) {
      for (const ruleDetail of ruleDetails) {
        if (!ruleDetail?.accountRole) continue;

        // 1. Buscamos el monto base usando el rol original
        let amount = item.amounts[ruleDetail.accountRole];

        // 2. Si no existe, buscamos si hay un alias provisto por el servicio externo (Ej. SAVINGS_RECEIVABLE -> ASSOCIATED_SAVINGS)
        if (
          amount === undefined &&
          params.roleAliases &&
          params.roleAliases[ruleDetail.accountRole]
        ) {
          amount = item.amounts[params.roleAliases[ruleDetail.accountRole]];
        }

        // 3. Si no existe un alias definido, y la BD define una fórmula, intentamos usar la fórmula como alias base
        if (
          amount === undefined &&
          ruleDetail.formula &&
          item.amounts[ruleDetail.formula] !== undefined
        ) {
          amount = item.amounts[ruleDetail.formula];
        }

        if (amount === undefined || amount === 0) continue;

        const isDebit = ruleDetail.movementType === 'DEBIT';
        const associateId = ruleDetail.isAuxiliary ? item.associateId : null;
        const supplierId = ruleDetail.isAuxiliarySupplier
          ? item.supplierId
          : null;

        // Extraer descripciones considerando también si hubo un mapeo por alias
        const aliasKey =
          params.roleAliases?.[ruleDetail.accountRole] || ruleDetail.formula;
        const mappedItemDesc =
          item.descriptions?.[ruleDetail.accountRole] ||
          (aliasKey ? item.descriptions?.[aliasKey] : undefined);
        const mappedGlobalDesc =
          params.globalDescriptions?.[ruleDetail.accountRole] ||
          (aliasKey ? params.globalDescriptions?.[aliasKey] : undefined);

        const description =
          associateId || supplierId
            ? mappedItemDesc || item.description || params.description
            : mappedGlobalDesc || item.description || params.description;

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

    const detailsDraft: CreateAccountingEntryDetailDto[] = Array.from(
      aggregatedDetails.values(),
    );

    const rr = await this.validateAccountingEntry(
      tenantId,
      cycle.id,
      params.entryDate,
      detailsDraft,
    );

    const voucherNo = await this.getNextVoucherNo(tenantId, userId, db);
    const [entry] = await db
      .insert(schema.accountingEntries)
      .values({
        tenantId: tenantId,
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

    // Mapeo para la inserción
    const detailsToInsert = detailsDraft.map((d) => ({
      accountPlanId: d.accountPlanId,
      accountingEntryId: entry.id,
      debit: d.debit.toString(),
      credit: d.credit.toString(),
      description: d.description,
      associateId: d.associateId ? String(d.associateId) : null,
      supplierId: d.supplierId ? String(d.supplierId) : null,
      createdById: userId,
    }));

    // CRITICO: Capturar los detalles reales retornados por la DB
    const insertedDetails = await db
      .insert(schema.accountingEntryDetails)
      .values(detailsToInsert)
      .returning();

    // Formatear salida final
    return {
      ...entry,
      // Convertir strings de fecha de DB a objetos Date de JS
      entryDate: entry.entryDate,
      postedAt: entry.postedAt ? new Date(entry.postedAt) : null,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : null,
      details: insertedDetails, // Ahora sí tiene id, createdAt, etc.
    } as AccountingEntryWithDetails;
  }

  /* ---------- Pasar a PENDIENTE ---------- */
  async submitEntry(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<AccountingEntryWithDetails> {
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== entryStatusEnum.DRAFT)
      throw new BadRequestException('Solo se puede someter en Borrador.');

    if (!existing.details?.length)
      throw new BadRequestException(
        'El asiento debe tener al menos dos líneas.',
      );

    await this.validateAccountingEntry(
      tenantId,
      existing.accountingCycleId,
      existing.entryDate,
      existing.details?.map((d) => ({
        accountPlanId: d.accountPlanId,
        debit: Number(d.debit),
        credit: Number(d.credit),
        description: d.description,
      })) as any,
    );

    await this.drizzle
      .update(schema.accountingEntries)
      .set({ status: entryStatusEnum.PENDING, updatedById: userId })
      .where(
        and(
          eq(schema.accountingEntries.id, id),
          eq(schema.accountingEntries.tenantId, tenantId),
        ),
      );

    return this.findOne(tenantId, id);
  }

  /* ---------- Contabilizar (POSTED) ---------- */
  async postEntry(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<AccountingEntryWithDetails> {
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== entryStatusEnum.PENDING)
      throw new BadRequestException('Solo se puede contabilizar en Pendiente.');

    const cycle = await this.accountingCyclesService.findOne(
      tenantId,
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
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.status, entryStatusEnum.PENDING),
        ),
      );

    return this.findOne(tenantId, id);
  }

  /* ---------- Anular (CANCELLED) ---------- */
  async cancelEntry(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<AccountingEntryWithDetails> {
    const original = await this.findOne(tenantId, id);
    if (original.status !== entryStatusEnum.POSTED)
      throw new BadRequestException(
        'Solo se puede anular un asiento CONTABILIZADO.',
      );

    const cycle = await this.accountingCyclesService.findOne(
      tenantId,
      original.accountingCycleId,
    );
    if (cycle.status !== 'OPEN')
      throw new BadRequestException('El ciclo contable está cerrado.');

    return this.drizzle.transaction(async (tx) => {
      if (!original.details?.length)
        throw new BadRequestException(
          'El asiento no tiene líneas para revertir.',
        );

      const reversal: CreateAccountingEntryDto = {
        entryDate: new Date(),
        description: `ANULACIÓN: ${original.description}`,
        originReferenceId: original.id?.toString(),
        originType: 'REVERSAL',
        currencyCode: original.currencyCode,
        details: original.details?.map((d) => ({
          accountPlanId: d.accountPlanId,
          debit: Number(d.credit).toString(),
          credit: Number(d.debit).toString(),
          description: `Reversión de ${d.description || ''}`,
        })) as any,
      };
      const result = await this.create(
        userId,
        tenantId,
        reversal,
        tx,
        entryStatusEnum.POSTED,
      );

      // Aseguramos que el reverso quede POSTED explícitamente
      await tx
        .update(schema.accountingEntries)
        .set({ status: entryStatusEnum.POSTED, postedAt: new Date() })
        .where(eq(schema.accountingEntries.id, result.id));

      await tx
        .update(schema.accountingEntries)
        .set({ status: entryStatusEnum.CANCELLED, updatedById: userId })
        .where(
          and(
            eq(schema.accountingEntries.id, id),
            eq(schema.accountingEntries.tenantId, tenantId),
          ),
        );

      return this.findOne(tenantId, id);
    });
  }

  async validateDto(
    tenantId: string,
    dto: CreateAccountingEntryDto,
  ): Promise<{
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
    lines: number;
  }> {
    const cycle = await this.findActiveCycle(tenantId, dto.entryDate);
    await this.validateAccountingEntry(
      tenantId,
      cycle.id,
      dto.entryDate,
      dto.details,
    );
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

  // async getTotals(
  //   tenantId: string,
  //   start: Date,
  //   end: Date,
  // ): Promise<{ totalDebit: number; totalCredit: number }> {
  //   const [row] = await this.drizzle
  //     .select({
  //       totalDebit: sql<number>`sum(${schema.accountingEntryDetails.debit})`,
  //       totalCredit: sql<number>`sum(${schema.accountingEntryDetails.credit})`,
  //     })
  //     .from(schema.accountingEntryDetails)
  //     .innerJoin(
  //       schema.accountingEntries,
  //       eq(
  //         schema.accountingEntries.id,
  //         schema.accountingEntryDetails.accountingEntryId,
  //       ),
  //     )
  //     .where(
  //       and(
  //         eq(schema.accountingEntries.tenantId, tenantId),
  //         eq(schema.accountingEntries.status, 'POSTED'),
  //         gte(
  //           schema.accountingEntries.entryDate,
  //           start.toISOString().split('T')[0],
  //         ),
  //         lte(
  //           schema.accountingEntries.entryDate,
  //           end.toISOString().split('T')[0],
  //         ),
  //       ),
  //     );

  //   return {
  //     totalDebit: row.totalDebit ?? 0,
  //     totalCredit: row.totalCredit ?? 0,
  //   };
  // }

  /* POST /api/entries/generate-opening
   body = { accountingCycleId, entryDate, balances: [{accountPlanId, amount}] } */
  // async generateOpening(
  //   userId: string,
  //   tenantId: string,
  //   dto: GenerateOpeningDto,
  // ): Promise<AccountingEntry> {
  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado o inexistente.');

  //   const capitalAcc = await this.drizzle
  //     .select()
  //     .from(schema.accountPlan)
  //     .where(
  //       and(
  //         eq(schema.accountPlan.code, '3.1.01.001'),
  //         eq(schema.accountPlan.tenantId, tenantId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!capitalAcc.length)
  //     throw new BadRequestException(
  //       'No existe cuenta de capital (3.1.01.001).',
  //     );

  //   const details: CreateAccountingEntryDetailDto[] = [
  //     ...dto.balances.map((b) => ({
  //       accountPlanId: b.accountPlanId,
  //       debit: b.amount,
  //       credit: 0,
  //       description: 'Saldo inicial según inventario',
  //     })),
  //     {
  //       accountPlanId: capitalAcc[0].id,
  //       debit: 0,
  //       credit: dto.balances.reduce((sum, b) => sum + b.amount, 0),
  //       description: 'Capital inicial',
  //     },
  //   ];

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Asiento de apertura',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }

  /* POST /api/entries/close-month
   body = { accountingCycleId, entryDate, resultAccountId } */
  // async closeMonth(
  //   userId: string,
  //   tenantId: string,
  //   dto: CloseMonthDto,
  // ): Promise<AccountingEntry> {
  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado o inexistente.');

  //   // 1. Obtener saldos de cuentas de resultado (4- y 5-) del ciclo
  //   const result = await this.drizzle
  //     .select({
  //       accountPlanId: schema.accountingEntryDetails.accountPlanId,
  //       nature: schema.accountPlan.nature,
  //       totalDebit: sql<number>`sum(${schema.accountingEntryDetails.debit})`,
  //       totalCredit: sql<number>`sum(${schema.accountingEntryDetails.credit})`,
  //     })
  //     .from(schema.accountingEntryDetails)
  //     .innerJoin(
  //       schema.accountingEntries,
  //       eq(
  //         schema.accountingEntries.id,
  //         schema.accountingEntryDetails.accountingEntryId,
  //       ),
  //     )
  //     .innerJoin(
  //       schema.accountPlan,
  //       eq(schema.accountPlan.id, schema.accountingEntryDetails.accountPlanId),
  //     )
  //     .where(
  //       and(
  //         eq(schema.accountingEntries.companyId, cycle.companyId),
  //         eq(schema.accountingEntries.accountingCycleId, dto.accountingCycleId),
  //         eq(schema.accountingEntries.status, 'POSTED'),
  //         inArray(schema.accountPlan.accountType, ['REVENUE', 'EXPENSE']),
  //       ),
  //     )
  //     .groupBy(
  //       schema.accountingEntryDetails.accountPlanId,
  //       schema.accountPlan.nature,
  //     );

  //   if (!result.length)
  //     throw new BadRequestException('No hay cuentas de resultado para cerrar.');

  //   // 2. Detalle: vaciar cada cuenta al resultado
  //   const details: CreateAccountingEntryDetailDto[] = [];
  //   let resultDebit = 0;
  //   let resultCredit = 0;

  //   for (const r of result) {
  //     const bal = (r.totalDebit ?? 0) - (r.totalCredit ?? 0);
  //     if (bal === 0) continue;
  //     if (r.nature === 'DEBIT') {
  //       details.push({
  //         accountPlanId: r.accountPlanId,
  //         debit: 0,
  //         credit: Math.abs(bal),
  //         description: 'Cierre de resultado',
  //       });
  //       if (bal > 0) resultCredit += bal;
  //       else resultDebit += Math.abs(bal);
  //     } else {
  //       details.push({
  //         accountPlanId: r.accountPlanId,
  //         debit: Math.abs(bal),
  //         credit: 0,
  //         description: 'Cierre de resultado',
  //       });
  //       if (bal > 0) resultDebit += bal;
  //       else resultCredit += Math.abs(bal);
  //     }
  //   }

  //   // 3. Contrapartida en cuenta de resultado
  //   const finalBal = resultDebit - resultCredit;
  //   details.push({
  //     accountPlanId: dto.resultAccountId,
  //     debit: finalBal < 0 ? Math.abs(finalBal) : 0,
  //     credit: finalBal > 0 ? finalBal : 0,
  //     description: 'Resultado del ejercicio',
  //   });

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Cierre de resultado',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }

  /* POST /api/entries/depreciation
   body = { accountingCycleId, entryDate, lines:[{assetAccountId, expenseAccountId, amount}] } */
  // async depreciate(
  //   userId: string,
  //   tenantId: string,
  //   dto: DepreciationDto,
  // ): Promise<AccountingEntry> {
  //   if (!dto.lines.length)
  //     throw new BadRequestException('No hay montos a depreciar.');

  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado.');

  //   const details: CreateAccountingEntryDetailDto[] = dto.lines.flatMap((l) => [
  //     {
  //       accountPlanId: l.expenseAccountId,
  //       debit: l.amount,
  //       credit: 0,
  //       description: 'Depreciación del mes',
  //     },
  //     {
  //       accountPlanId: l.assetAccountId,
  //       debit: 0,
  //       credit: l.amount,
  //       description: 'Depreciación acumulada',
  //     },
  //   ]);

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Asiento de depreciación',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }

  /* POST /api/entries/bank-reconciliation
   body = { accountingCycleId, entryDate, items:[{accountId, amount, description}] } */
  // async bankReconciliation(
  //   userId: string,
  //   tenantId: string,
  //   dto: BankReconciliationDto,
  // ): Promise<AccountingEntry> {
  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado.');

  //   const details: CreateAccountingEntryDetailDto[] = dto.items.map((i) => ({
  //     accountPlanId: i.accountId,
  //     debit: i.amount > 0 ? i.amount : 0,
  //     credit: i.amount < 0 ? Math.abs(i.amount) : 0,
  //     description: i.description || 'Ajuste por conciliación',
  //   }));

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Ajustes de conciliación bancaria',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }

  /* POST /api/entries/inventory-adjust
   body = { accountingCycleId, entryDate, items:[{inventoryAccountId, expenseAccountId, qty, cost}] } */
  // async inventoryAdjust(
  //   userId: string,
  //   tenantId: string,
  //   dto: InventoryAdjustDto,
  // ): Promise<AccountingEntry> {
  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado.');

  //   const details: CreateAccountingEntryDetailDto[] = dto.items.flatMap((i) => {
  //     const total = i.qty * i.unitCost;
  //     if (total === 0) return [];
  //     if (total > 0) {
  //       // Sobrante  inventario ↑
  //       return [
  //         {
  //           accountPlanId: i.inventoryAccountId,
  //           debit: total,
  //           credit: 0,
  //           description: 'Ajuste por inventario (sobrante)',
  //         },
  //         {
  //           accountPlanId: i.expenseAccountId,
  //           debit: 0,
  //           credit: total,
  //           description: 'Ingreso por sobrante',
  //         },
  //       ];
  //     } else {
  //       // Merma  inventario ↓
  //       const abs = Math.abs(total);
  //       return [
  //         {
  //           accountPlanId: i.expenseAccountId,
  //           debit: abs,
  //           credit: 0,
  //           description: 'Merma / deterioro',
  //         },
  //         {
  //           accountPlanId: i.inventoryAccountId,
  //           debit: 0,
  //           credit: abs,
  //           description: 'Ajuste por inventario (merma)',
  //         },
  //       ];
  //     }
  //   });

  //   if (!details.length)
  //     throw new BadRequestException('No hay ajustes a registrar.');

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Ajustes de inventario',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }

  /* POST /api/entries/tax-provision
   body = { accountingCycleId, entryDate, items:[{expenseAccountId, taxPayableAccountId, amount}] } */
  // async taxProvision(
  //   userId: string,
  //   tenantId: string,
  //   dto: TaxProvisionDto,
  // ): Promise<AccountingEntry> {
  //   const cycle = await this.accountingCyclesService.findOne(
  //     dto.accountingCycleId,
  //   );
  //   if (!cycle || cycle.status !== 'OPEN')
  //     throw new BadRequestException('Ciclo cerrado.');

  //   const details: CreateAccountingEntryDetailDto[] = dto.items.flatMap((i) => [
  //     {
  //       accountPlanId: i.expenseAccountId,
  //       debit: i.amount,
  //       credit: 0,
  //       description: 'Gasto por impuesto',
  //     },
  //     {
  //       accountPlanId: i.taxPayableAccountId,
  //       debit: 0,
  //       credit: i.amount,
  //       description: 'Impuesto por pagar',
  //     },
  //   ]);

  //   return this.create(userId, tenantId, {
  //     tenantId: tenantId,
  //     accountingCycleId: dto.accountingCycleId,
  //     entryDate: dto.entryDate,
  //     description: 'Provisiones de impuestos',
  //     currencyCode: 'VES' as CurrencyCodeEnum,
  //     details,
  //   });
  // }
  /* ---------- Helpers ---------- */
  private async getNextVoucherNo(
    tenantId: string,
    createdBy: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const [setting] = await tx
      .select()
      .from(schema.moduleSettings)
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'accounting'),
          eq(schema.moduleSettings.submodule, 'chart_of_accounts'),
          eq(schema.moduleSettings.key, 'NRO-ASIENTO'),
        ),
      );

    const nextValue = parseInt(setting.value ?? '0', 10) + 1;

    await tx
      .update(schema.moduleSettings)
      .set({ value: nextValue.toString(), updatedBy: createdBy })
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'accounting'),
          eq(schema.moduleSettings.submodule, 'chart_of_accounts'),
          eq(schema.moduleSettings.key, 'NRO_ASIENTO'),
        ),
      );

    return nextValue;
  }
}
