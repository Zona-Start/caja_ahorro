import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { states } from '../index';
import { States } from './default';

export async function seedStates(db: NodePgDatabase<typeof schema>) {

  for (const state of States) {
    const stateData = {
      ...state,
      createdById: 1,
      updatedById: 1,
    }
    try {
      await db.insert(states).values(stateData).onConflictDoNothing();
    } catch (error) {
      console.error(`Error creating state '${state.name}':`, error);
    }
  }
  console.log('State seeded successfully');
}
