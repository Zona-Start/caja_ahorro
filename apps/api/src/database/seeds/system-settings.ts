import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { systemSettings } from '../index';

export async function seedSystemSetting(db: NodePgDatabase<typeof schema>) {
  try {
    await db
      .insert(systemSettings)
      .values({
        key: 'IVA-VENTA',
        value: '16',
        description: 'IVA VENTAS',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'MONEDA',
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
        key: 'PORCENTAJE_PRESTAMOS',
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
        key: 'TIEMPO_RETIRO',
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
        key: 'ASIENTOS_AUTOMATICOS',
        value: 'SI',
        description: 'Asientos Automaticos',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'FRECUENCIA-DESCUENTO',
        value: 'Quincenal',
        description: 'Frecuencia de Descuento por defecto',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'NRO-ASIENTO',
        value: '0',
        description: 'Último consecutivo Asiento Contable',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'PAYROLL-DEFAULT',
        value: 'Aporte Empleados',
        description: 'Tipo de nomina por defecto',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'UTILIDAD-PRODUCTO',
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
        key: 'GASTO-PRODUCTO',
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
        key: 'IVA-COMPRA',
        value: '16',
        description: 'IVA FACTURAS DE COMPRA',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'CODIGO_BANCO_CAJA',
        value: '005823',
        description: 'CÓDIGO BANCARIO CAJA PARA TRANSACCIONES EN LOTE',
        group: 'GENERAL',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'SOC',
        value: '0',
        description: 'Último consecutivo referencia Asociado 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'PRD',
        value: '0',
        description: 'Último consecutivo SKU Producto 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'SRV',
        value: '0',
        description: 'Último consecutivo código servicio 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'ACT',
        value: '0',
        description: 'Último consecutivo código activo 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'PROV',
        value: '0',
        description: 'Último consecutivo código proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'MS-2025',
        value: '0',
        description: 'Último consecutivo  Movimiento Asociados 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'RH-RET-2025',
        value: '0',
        description: 'Último consecutivo Retiro Movimiento Haberes 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'RH-LIQ-2025',
        value: '0',
        description: 'Último consecutivo Liquidación Movimiento Haberes 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'PRE-2025',
        value: '0',
        description: 'Último consecutivo Prestamo 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'PRE-PAG-2025',
        value: '0',
        description: 'Último consecutivo Pago de Prestamo 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'CRE-2025',
        value: '0',
        description: 'Último consecutivo Credito 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'CRE-PAG-2025',
        value: '0',
        description: 'Último consecutivo Pago Credito 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'INV-ENT-2025',
        value: '0',
        description: 'Último consecutivo Inventario Entrada 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'INV-SAL-2025',
        value: '0',
        description: 'Último consecutivo Inventario Salida 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'INV-AJU-2025',
        value: '0',
        description: 'Último consecutivo Inventario Ajuste 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'ORD-2025',
        value: '0',
        description: 'Último consecutivo OC 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'FAC-P-2025',
        value: '0',
        description: 'Último consecutivo Recepción Factura 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'CXP-2025',
        value: '0',
        description: 'Último consecutivo Cuenta por Pagar 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'PAG-P-2025',
        value: '0',
        description: 'Último consecutivo Pago a Proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'MB-2025',
        value: '0',
        description: 'Último consecutivo Movimiento Bancario 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'ADV-P-2025',
        value: '0',
        description: 'Último consecutivo Anticipo Proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'TRS-P-2025',
        value: '0',
        description: 'Último consecutivo Transacción Proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'LOT-P-2025',
        value: '0',
        description: 'Último consecutivo Lote Desembolsos 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();

    await db
      .insert(systemSettings)
      .values({
        key: 'NC-P-2025',
        value: '0',
        description: 'Último consecutivo Nota Crédito Proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    await db
      .insert(systemSettings)
      .values({
        key: 'ND-P-2025',
        value: '0',
        description: 'Último consecutivo Nota Débito Proveedor 2025',
        group: 'DOCUMENTS',
        createdById: 1,
        updatedById: 1,
      })
      .onConflictDoNothing();
    console.log('System Setting seeded successfully');
  } catch (error) {
    console.error('Error creating System Setting:', error);
  }
}
