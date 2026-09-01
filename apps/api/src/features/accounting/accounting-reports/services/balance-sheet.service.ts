import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, sql } from 'drizzle-orm';
import { BalanceSheetDto } from '../dto/balance-sheet.dto';
import { buildBalanceSheetTableContent } from '../templates/pdf/balance-sheet.template';

export interface AccountNode {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'EXPENSE' | 'REVENUE' | 'INCOME' | 'MEMORANDUM';
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
  ) { }

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
    const { accountingCycleId, detailLevel = 3 } = filters;

    // 1. Consulta SQL de cuentas de balance y sus saldos precargados o calculados en la vista
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
        finalBalance: sql<number>`COALESCE(${schema.mvAccountBalances.finalBalance}, 0)`,
      })
      .from(schema.accountPlan)
      .leftJoin(
        schema.mvAccountBalances,
        and(
          eq(schema.mvAccountBalances.accountPlanId, schema.accountPlan.id),
          eq(schema.mvAccountBalances.tenantId, tenantId),
          accountingCycleId
            ? eq(schema.mvAccountBalances.accountingCycleId, accountingCycleId)
            : undefined,
        ),
      )
      .where(eq(schema.accountPlan.tenantId, tenantId))
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
      const groupAccounts = normalizedAccounts.filter((a) => a.accountType === type);

      let root = groupAccounts.find((a) => a.level === 1 || a.accountCode === rootCode);

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
        0
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
    const finalLiabilities = pruneTreeByDetailLevel(liabilitiesTree, 1, detailLevel);
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
        totalLiabilitiesAndEquity: (totalLiabilitiesNum + totalEquityNum).toFixed(2),
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
      children: n.children && n.children.length > 0 ? this.toResponse(n.children) : [],
    }));
  }

  /**
   * Generación del documento PDF a partir del balance procesado.
   */
  async generatePdf(tenantId: string, filters: BalanceSheetDto) {
    const data = await this.getData(tenantId, filters);
    const content = buildBalanceSheetTableContent(data);
    return this.pdfService.generateReport('BALANCE GENERAL', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}