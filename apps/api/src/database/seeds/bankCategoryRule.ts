// src/db/seed/bankCategoryRule.seed.ts
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';

export async function seedBankCategoryRule(db: NodePgDatabase<typeof schema>) {
  try {
    const rules = [
      // Haberes
      {
        category: 'MEMBER_CONTRIBUTION',
        internalTable: 'associateAccountMovements',
        recordStatus: null,
        direction: 'I',
        autoList: true,
      },
      {
        category: 'MEMBER_WITHDRAWAL',
        internalTable: 'withdrawalsAssociates',
        recordStatus: 'APPROVED',
        direction: 'O',
        autoList: true,
      },
      {
        category: 'PAYROLL_SETTLEMENT',
        internalTable: 'liquidationsAssociates',
        recordStatus: 'REQUESTED',
        direction: 'O',
        autoList: true,
      },

      // Préstamos
      {
        category: 'LOAN_DISBURSEMENT',
        internalTable: 'loans',
        recordStatus: 'APPROVED',
        direction: 'O',
        autoList: true,
      },
      {
        category: 'LOAN_PAYMENT',
        internalTable: 'loanPayments',
        recordStatus: null,
        direction: 'I',
        autoList: true,
      },

      // Créditos
      {
        category: 'CREDIT_DISBURSEMENT',
        internalTable: 'credits',
        recordStatus: 'APPROVED',
        direction: 'O',
        autoList: true,
      },
      {
        category: 'CREDIT_PAYMENT',
        internalTable: 'creditPayments',
        recordStatus: null,
        direction: 'I',
        autoList: true,
      },

      // Cuentas por pagar
      {
        category: 'SUPPLIER_PAYMENT',
        internalTable: 'supplierPayments',
        recordStatus: 'PENDING',
        direction: 'O',
        autoList: true,
      },
      {
        category: 'SUPPLIER_ADVANCE_PAYMENT',
        internalTable: 'supplierAdvances',
        recordStatus: 'PENDING',
        direction: 'O',
        autoList: true,
      },
      // Transferencias internas
      {
        category: 'INTERNAL_TRANSFER',
        internalTable: null,
        recordStatus: null,
        direction: 'I',
        autoList: false,
      },
      {
        category: 'INTERNAL_TRANSFER',
        internalTable: null,
        recordStatus: null,
        direction: 'O',
        autoList: false,
      },

      // Gastos / ingresos bancarios puros
      {
        category: 'BANK_FEE',
        internalTable: null,
        recordStatus: null,
        direction: 'O',
        autoList: false,
      },
      {
        category: 'INTEREST_EARNED',
        internalTable: null,
        recordStatus: null,
        direction: 'I',
        autoList: false,
      },
      {
        category: 'INTEREST_CHARGED',
        internalTable: null,
        recordStatus: null,
        direction: 'O',
        autoList: false,
      },
      {
        category: 'BANK_ADJUSTMENT',
        internalTable: null,
        recordStatus: null,
        direction: 'I',
        autoList: false,
      },
      {
        category: 'TAX_DEBIT',
        internalTable: null,
        recordStatus: null,
        direction: 'O',
        autoList: false,
      },
      {
        category: 'TAX_CREDIT',
        internalTable: null,
        recordStatus: null,
        direction: 'I',
        autoList: false,
      },
      {
        category: 'OTHER_INCOME',
        internalTable: null,
        recordStatus: null,
        direction: 'I',
        autoList: false,
      },
      {
        category: 'OTHER_EXPENSE',
        internalTable: null,
        recordStatus: null,
        direction: 'O',
        autoList: false,
      },
    ] as const;

    for (const r of rules) {
      await db
        .insert(schema.bankCategoryRule)
        .values({
          category: r.category,
          internalTable: r.internalTable,
          recordStatus: r.recordStatus,
          direction: r.direction,
          autoList: r.autoList,
          // Si tienes cuentas contables por defecto pon aquí:
          // defaultDebitAccountId: ...,
          // defaultCreditAccountId: ...,
        })
        .onConflictDoNothing(); // evita duplicados si vuelves a correr el seed
    }

    console.log('✅ bankCategoryRule seeded');
  } catch (e) {
    console.error('❌ Error seeding bankCategoryRule', e);
    throw e;
  }
}
