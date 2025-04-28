import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { categoryType } from '../index';

export async function seedCategories(db: NodePgDatabase<typeof schema>) {
  try {
    // Payroll Frequencies
    const frequencies = [
      { description: 'Semanal', options: [{ frequency: '52' }] },
      { description: 'Quincenal', options: [{ frequency: '24' }] },
      { description: 'Mensual', options: [{ frequency: '12' }] },
      { description: 'Trimestral', options: [{ frequency: '4' }] },
      { description: 'Semestral', options: [{ frequency: '2' }] },
      { description: 'Anual', options: [{ frequency: '1' }] },
    ];

    // Payroll Types (from the image "tipo_nomina.jpg")
    const payrollTypes = [
      { description: 'Aportes Empleados (5501)', options: null },
      { description: 'Descuentos Caja (5800)', options: null },
      { description: 'Prestamos Personales (5502)', options: null },
      { description: 'Prestamo Hipotecario (5504)', options: null },
      { description: 'Credito Moto (5508)', options: null },
      { description: 'Prestamos Afianzados (5518)', options: null },
      { description: 'Credito Vehiculo (5559)', options: null },
      { description: 'Prestamo Mediano Plazo (5634)', options: null },
      { description: 'Prestamo Largo Plazo (5635)', options: null },
      { description: 'Reintegro Caja (0059)', options: null },
      { description: 'Reintegro Prestamos (0020)', options: null },
      { description: 'Credito Telefono (5594)', options: null },
      { description: 'Credisalario (5022)', options: null },
      { description: 'Credito Comercial (5025)', options: null },
    ];

    // Associate Types (from the image "tipos_Asociados.jpg")
    const WorkingTypes = [
      { description: 'Empleados', options: null },
      { description: 'Nivel Gerencial', options: null },
      { description: 'Pensionados', options: null },
      { description: 'Jubilados', options: null },
      { description: 'Nivel Ejecutivo', options: null },
      { description: 'Personal en Comision de Servicio', options: null },
      {
        description: 'Personal Contratado a Tiempo Determinado',
        options: null,
      },
    ];

    // Insert Payroll Frequencies
    for (const frequency of frequencies) {
      await db
        .insert(categoryType)
        .values({
          group: 'DISCOUNT_FREQ',
          description: frequency.description,
          options: frequency.options,
          isActive: true,
          createdById: 1,
          updatedById: 1,
        })
        .onConflictDoNothing();
    }

    // Insert Associate Types
    for (const workingTypes of WorkingTypes) {
      await db
        .insert(categoryType)
        .values({
          group: 'WORKING_TYPE',
          description: workingTypes.description,
          options: workingTypes.options,
          isActive: true,
          createdById: 1,
          updatedById: 1,
        })
        .onConflictDoNothing();
    }

    console.log('Category types seeded successfully');
  } catch (error) {
    console.error('Error seeding category types:', error);
  }
}
