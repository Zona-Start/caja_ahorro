import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { currencies } from '../index';

export async function seedCurrencies(db: NodePgDatabase<typeof schema>) {
  try {
    await db
      .insert(currencies)
      .values({
        code: 'VES',
        name: 'Bolivar',
        symbol: 'BS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(currencies)
      .values({
        code: 'USD',
        name: 'Dolar',
        symbol: '$',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    console.log('Currencies seeded successfully');
  } catch (error) {
    console.error('Error creating Currencies:', error);
  }
}
