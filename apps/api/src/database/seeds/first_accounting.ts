// 1) SEED: primer ciclo contable abierto
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { accountingCycles } from '../index';

export async function seedFirstAccountingCycle(
  db: NodePgDatabase<typeof schema>,
) {
  try {
    await db
      .insert(accountingCycles)
      .values({
        companyId: 1, // ajusta según tu empresa por defecto
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        description: 'Ciclo Contable 2025',
        status: 'OPEN',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing(); // único por (companyId, startDate, endDate)

    console.log('First accounting cycle seeded successfully');
  } catch (error) {
    console.error('Error creating first accounting cycle:', error);
  }
}

// export async function seedAccountingConfiguration(
//   db: NodePgDatabase<typeof schema>,
// ) {
//   try {
//     await db
//       .insert(accountingConfiguration)
//       .values({
//         companyId: 1, // ajusta según tu empresa por defecto
//         operationType: 'BANK_RECONCILIATION_ADJUSTMENT',
//         descriptionTemplate: 'Ajuste conciliación inicial cuenta #{accountId}',
//         debitAccountId: 4,
//         creditAccountId: 57,
//         contraAccountId: 56,
//         isActive: true,
//         createdById: 1,
//         updatedById: 1,
//       })
//       .onConflictDoNothing(); // único por (companyId, startDate, endDate)

//     await db
//       .insert(accountingConfiguration)
//       .values({
//         companyId: 1, // ajusta según tu empresa por defecto
//         operationType: 'INITIAL_BALANCE_BANK',
//         descriptionTemplate: 'Saldo inicial cuenta #{accountId}',
//         debitAccountId: 4,
//         creditAccountId: 3,
//         contraAccountId: null,
//         isActive: true,
//         createdById: 1,
//         updatedById: 1,
//       })
//       .onConflictDoNothing(); // único por (companyId, startDate, endDate)

//     console.log('First accounting configuration seeded successfully');
//   } catch (error) {
//     console.error('Error creating first accounting cycle:', error);
//   }
// }
