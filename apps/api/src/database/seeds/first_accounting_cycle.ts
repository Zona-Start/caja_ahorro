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
