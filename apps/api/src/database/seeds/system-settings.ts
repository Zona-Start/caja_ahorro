import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { systemSettings } from '../index';

export async function seedSystemSetting(db: NodePgDatabase<typeof schema>) {
  try {
    await db
      .insert(systemSettings)
      .values({ key: 'iva', value: '6', createdById: 1, updatedById: 1 })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'correlativo_prestamo',
        value: '00001',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'correlativo_credito',
        value: '00001',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'retiro_haberes',
        value: '00001',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({ key: 'moneda', value: '1', createdById: 1, updatedById: 1 })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'porcentaje_prestamos',
        value: '6',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    console.log('System Setting seeded successfully');
  } catch (error) {
    console.error('Error creating System Setting:', error);
  }
}
