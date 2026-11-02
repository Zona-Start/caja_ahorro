import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BalanceSheetDto } from '../dto/balance-sheet.dto';
import { buildBalanceSheetTableContent } from '../templates/pdf/balance-sheet.template';

export interface AccountNode {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  accountType:
    | 'ASSET'
    | 'LIABILITY'
    | 'EQUITY'
    | 'EXPENSE'
    | 'REVENUE'
    | 'INCOME'
    | 'MEMORANDUM';
  accountNature: 'DEBIT' | 'CREDIT';
  level: number;
  parentAccountId?: string | null;
  allowsMovements: boolean;
  finalBalance: number;
  balanceNum: number;
  children: AccountNode[];
}

@Injectable()
export class BalanceSheetService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  /**
   * Determina el nivel jerárquico contable basándose en la máscara del código.
   */
  private calculateLevel(code: string): number {
    const cleanCode = code.trim();
    if (['100.00.00', '200.00.00', '300.00.00'].includes(cleanCode)) return 1;
    if (cleanCode.endsWith('.00.00')) return 2;
    if (cleanCode.endsWith('.00')) return 3;
    return 4;
  }

  async getData(tenantId: string, filters: BalanceSheetDto) {
    const { accountingCycleId, startDate, endDate, detailLevel = 3 } = filters;

    if (startDate > endDate) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
    }

    // 1. Saldos de las cuentas de balance al cierre de la fecha "hasta".
    //    Se parte del saldo inicial del ciclo y se suman los movimientos
    //    POSTED hasta esa fecha. La carga inicial ya está incluida en el
    //    saldo inicial, por eso se excluye su asiento del sumatorio.
    const rawData = await this.drizzle
      .select({
        accountPlanId: schema.accountPlan.id,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        accountNature: schema.accountPlan.nature,
        level: schema.accountPlan.level,
        parentAccountId: schema.accountPlan.parentAccountId,
        allowsMovements: schema.accountPlan.allowsMovements,
        finalBalance: sql<number>`
          COALESCE(${schema.accountBalances.initialBalance}, 0) +
          COALESCE(SUM(
            CASE
              WHEN ${schema.accountingEntries.id} IS NULL THEN 0
              WHEN ${schema.accountPlan.nature} = 'DEBIT'
                THEN ${schema.accountingEntryDetails.debit} - ${schema.accountingEntryDetails.credit}
              ELSE ${schema.accountingEntryDetails.credit} - ${schema.accountingEntryDetails.debit}
            END
          ), 0)
        `,
      })
      .from(schema.accountPlan)
      .leftJoin(
        schema.accountBalances,
        and(
          eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
          eq(schema.accountBalances.tenantId, tenantId),
          eq(schema.accountBalances.accountingCyclesId, accountingCycleId),
        ),
      )
      .leftJoin(
        schema.accountingEntryDetails,
        eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
      )
      .leftJoin(
        schema.accountingEntries,
        and(
          eq(
            schema.accountingEntries.id,
            schema.accountingEntryDetails.accountingEntryId,
          ),
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
          eq(schema.accountingEntries.status, 'POSTED'),
          lte(schema.accountingEntries.entryDate, endDate),
          sql`${schema.accountingEntries.originType} IS DISTINCT FROM 'INITIAL_LOAD'`,
        ),
      )
      .where(eq(schema.accountPlan.tenantId, tenantId))
      .groupBy(
        schema.accountPlan.id,
        schema.accountPlan.code,
        schema.accountPlan.name,
        schema.accountPlan.accountType,
        schema.accountPlan.nature,
        schema.accountPlan.level,
        schema.accountPlan.parentAccountId,
        schema.accountPlan.allowsMovements,
        schema.accountBalances.initialBalance,
      )
      .orderBy(asc(schema.accountPlan.code));

    // 2. Normalización de datos respetando los montos brutos almacenados en Postgres
    const normalizedAccounts: AccountNode[] = rawData
      .filter((r) => ['ASSET', 'LIABILITY', 'EQUITY'].includes(r.accountType))
      .map((acc) => {
        const balance = Number(acc.finalBalance || 0);
        return {
          ...acc,
          accountType: acc.accountType as AccountNode['accountType'],
          level: this.calculateLevel(acc.accountCode),
          finalBalance: balance,
          balanceNum: balance,
          children: [],
        };
      });

    // 3. Construcción del árbol basándose estrictamente en la relación parentAccountId de la BD
    const buildGroupTree = (
      type: 'ASSET' | 'LIABILITY' | 'EQUITY',
      rootCode: string,
      rootName: string,
    ): AccountNode[] => {
      const groupAccounts = normalizedAccounts.filter(
        (a) => a.accountType === type,
      );

      let root = groupAccounts.find(
        (a) => a.level === 1 || a.accountCode === rootCode,
      );

      if (!root) {
        root = {
          accountPlanId: `synthetic-${type.toLowerCase()}`,
          accountCode: rootCode,
          accountName: rootName,
          accountType: type,
          accountNature: 'DEBIT',
          level: 1,
          parentAccountId: null,
          allowsMovements: false,
          finalBalance: 0,
          balanceNum: 0,
          children: [],
        };
      } else {
        root.children = [];
      }

      const accountMap = new Map<string, AccountNode>();
      groupAccounts.forEach((acc) => {
        acc.children = acc.children || [];
        accountMap.set(acc.accountPlanId, acc);
      });

      const rootNode = root;
      rootNode.children = rootNode.children || [];

      groupAccounts.forEach((node) => {
        if (node.accountPlanId === rootNode.accountPlanId) return;

        if (node.parentAccountId && accountMap.has(node.parentAccountId)) {
          const parentNode = accountMap.get(node.parentAccountId);
          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
          }
        } else {
          rootNode.children.push(node);
        }
      });

      return [rootNode];
    };

    const assetsTree = buildGroupTree('ASSET', '100.00.00', 'ACTIVOS');
    const liabilitiesTree = buildGroupTree('LIABILITY', '200.00.00', 'PASIVOS');
    const equityTree = buildGroupTree('EQUITY', '300.00.00', 'PATRIMONIO');

    // 4. Roll-up recursivo desde las subcuentas u hojas
    // 4. Roll-up recursivo correcto: Suma de cuentas hijas/hoja
    const aggregateBalances = (node: AccountNode): number => {
      // Si no tiene hijos, devuelve su propio saldo (solo si permite movimientos)
      if (!node.children || node.children.length === 0) {
        return node.allowsMovements ? node.finalBalance : 0;
      }

      // Si tiene hijos, su saldo total ES ÚNICAMENTE la suma recursiva de sus hijos
      const childrenSum = node.children.reduce(
        (acc, child) => acc + aggregateBalances(child),
        0,
      );

      // Si el nodo padre también permite movimientos (no recomendado pero posible), suma su propio saldo
      const ownBalance = node.allowsMovements ? node.finalBalance : 0;

      node.finalBalance = ownBalance + childrenSum;
      node.balanceNum = node.finalBalance;
      return node.finalBalance;
    };

    assetsTree.forEach((r) => aggregateBalances(r));
    liabilitiesTree.forEach((r) => aggregateBalances(r));
    equityTree.forEach((r) => aggregateBalances(r));

    const totalAssetsNum = assetsTree[0]?.finalBalance ?? 0;
    const totalLiabilitiesNum = liabilitiesTree[0]?.finalBalance ?? 0;
    const totalEquityNum = equityTree[0]?.finalBalance ?? 0;

    // 5. Poda limpia del árbol para ajustar el detailLevel visual en el cliente
    const pruneTreeByDetailLevel = (
      nodes: AccountNode[],
      currentLevel: number,
      maxLevel: number,
    ): AccountNode[] => {
      return nodes.map((node) => ({
        ...node,
        children:
          currentLevel < maxLevel && node.children && node.children.length > 0
            ? pruneTreeByDetailLevel(node.children, currentLevel + 1, maxLevel)
            : [],
      }));
    };

    const finalAssets = pruneTreeByDetailLevel(assetsTree, 1, detailLevel);
    const finalLiabilities = pruneTreeByDetailLevel(
      liabilitiesTree,
      1,
      detailLevel,
    );
    const finalEquity = pruneTreeByDetailLevel(equityTree, 1, detailLevel);

    // 6. Obtención opcional de detalles del ciclo contable
    let cycleInfo: any = null;
    if (accountingCycleId) {
      const [cycle] = await this.drizzle
        .select({
          cycleId: schema.accountingCycles.id,
          description: schema.accountingCycles.description,
          endDate: schema.accountingCycles.endDate,
        })
        .from(schema.accountingCycles)
        .where(
          and(
            eq(schema.accountingCycles.id, accountingCycleId),
            eq(schema.accountingCycles.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (cycle) cycleInfo = cycle;
    }

    // 7. Estructura final formateada
    return {
      assets: {
        title: 'ACTIVOS',
        accounts: this.toResponse(finalAssets),
        total: totalAssetsNum.toFixed(2),
      },
      liabilities: {
        title: 'PASIVOS',
        accounts: this.toResponse(finalLiabilities),
        total: totalLiabilitiesNum.toFixed(2),
      },
      equity: {
        title: 'PATRIMONIO',
        accounts: this.toResponse(finalEquity),
        total: totalEquityNum.toFixed(2),
      },
      totals: {
        totalAssets: totalAssetsNum.toFixed(2),
        totalLiabilities: totalLiabilitiesNum.toFixed(2),
        totalEquity: totalEquityNum.toFixed(2),
        totalLiabilitiesAndEquity: (
          totalLiabilitiesNum + totalEquityNum
        ).toFixed(2),
      },
      cycleInfo,
    };
  }

  /**
   * Mapea el árbol recursivo a un formato limpio de transferencia de respuesta DTO/JSON.
   */
  private toResponse(nodes: AccountNode[]): any[] {
    return nodes.map((n) => ({
      id: n.accountPlanId,
      code: n.accountCode,
      name: n.accountName,
      level: n.level,
      balance: (n.finalBalance ?? 0).toFixed(2),
      children:
        n.children && n.children.length > 0 ? this.toResponse(n.children) : [],
    }));
  }

  /**
   * Generación del documento PDF a partir del balance procesado.
   */
  async generatePdf(tenantId: string, filters: BalanceSheetDto) {
    const data = await this.getData(tenantId, filters);
    const content = buildBalanceSheetTableContent(data);
    const dateLabel = this.buildFilterDateLabel(
      filters.startDate,
      filters.endDate,
    );
    const levelLabel = `Nivel de detalle: ${filters.detailLevel ?? 3}`;

    return this.pdfService.generateReport('BALANCE GENERAL', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
      tenantId,
      subtitle: `${dateLabel} · ${levelLabel}`,
    });
  }

  private buildFilterDateLabel(startDate?: string, endDate?: string) {
    const format = (value?: string) => {
      if (!value) return null;
      const [year, month, day] = value.split('-');
      return year && month && day ? `${day}/${month}/${year}` : value;
    };

    const from = format(startDate);
    const to = format(endDate);

    if (from && to) return `Del ${from} al ${to}`;
    if (from) return `Desde ${from}`;
    if (to) return `Hasta ${to}`;
    return 'Todos los movimientos';
  }
}
