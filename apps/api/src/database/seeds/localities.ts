import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { localities } from '../index';
import { Localities } from './default';

export async function seedLocalities(db: NodePgDatabase<typeof schema>) {

  for (const locality of Localities) {
    const localityData = {
      ...locality,
      createdById: 1,
      updatedById: 1,
    }
    try {
      await db.insert(localities).values(localityData).onConflictDoNothing();
    } catch (error) {
      console.error(`Error creating locality '${locality.name}':`, error);
    }
  }
  console.log('localities seeded successfully');
}
