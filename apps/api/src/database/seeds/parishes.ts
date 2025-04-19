import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { parishes } from '../index';
import { Parishes } from './default';

export async function seedParishes(db: NodePgDatabase<typeof schema>) {

  for (const parish of Parishes) {
    const parishData = {
      ...parish,
      createdById: 1,
      updatedById: 1,
    }
    try {
      await db.insert(parishes).values(parishData).onConflictDoNothing();
    } catch (error) {
      console.error(`Error creating parihs '${parish.name}':`, error);
    }
  }
  console.log('Parishes seeded successfully');
}
