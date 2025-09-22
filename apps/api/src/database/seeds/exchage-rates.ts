import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { exchangeRates } from '../index';

export async function seedExchangeRate(db: NodePgDatabase<typeof schema>) {
  try {
    await db
      .insert(exchangeRates)
      .values({
        date: 'now()',
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'VES',
        rate: '163.64',
        source: 'BCV',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    console.log('Exchnge rates seeded successfully');
  } catch (error) {
    console.error('Error creating Exchnge rates:', error);
  }
}
