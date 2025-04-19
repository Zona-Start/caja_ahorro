import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { municipalities } from '../index';
import { Municipalities } from './default';

export async function seedMunicipalites(db: NodePgDatabase<typeof schema>) {

  for (const municipality of Municipalities) {
    const municipalityData = {
        ...municipality,
        createdById: 1,
        updatedById: 1,
      }
    try {
      await db.insert(municipalities).values(municipalityData).onConflictDoNothing();
    } catch (error) {
      console.error(`Error creating municipality '${municipality.name}':`, error);
    }
  }
  console.log('Municipalities seeded successfully');
}
