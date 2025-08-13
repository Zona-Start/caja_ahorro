import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { systemSettings } from '../index';

export async function seedSystemSetting(db: NodePgDatabase<typeof schema>) {
  try {
    await db
      .insert(systemSettings)
      .values({
        key: 'iva_venta',
        value: '16',
        description: 'IVA',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'correlativo_prestamo',
        value: '00001',
        description: 'CORRELATIVO PRESTAMO',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'correlativo_credito',
        value: '00001',
        description: 'CORRELATIVO CREDITO',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'retiro_haberes',
        value: '00001',
        description: 'CORRELATIVO RETIRO HABERES',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'moneda',
        value: '1',
        description: 'MONEDA SISTEMA',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'porcentaje_prestamos',
        value: '12',
        description: 'PORCENTAJE PRESTAMO',
        group: 'LOANS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'tiempo_retiro',
        value: '6',
        description: 'TIEMPO RETIROS EN MESES',
        group: 'WITHDRAWAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'correlativo_producto',
        value: '00001',
        description: 'CORRELATIVO PRODUCTOS',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'utilidad_producto',
        value: '25',
        description: 'UTILIDAD PRODUCTO',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'gasto_producto',
        value: '6',
        description: 'GASTO ADMINISTRATIVOS PRODUCTO',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'iva_compra',
        value: '16',
        description: 'IVA FACTURAS DE COMPRA',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    console.log('System Setting seeded successfully');
  } catch (error) {
    console.error('Error creating System Setting:', error);
  }
}
