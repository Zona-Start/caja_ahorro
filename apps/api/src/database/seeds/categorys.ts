import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { categoryType, typePayrolls } from '../index';

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
      {
        code: '5502',
        description: 'Aportes Asociado (5502)',
        deferred_date: '2022-03-31',
        date_canceled: '2022-03-31',
        deferred_number: 81,
        number_canceled: 91,
        group: 'ASSETS',
        metadata: null,
        associated_account: 60,
        employer_account: 548,
        loan_account: 525,
      },
    ];

    // Associate Types (from the image "tipos_Asociados.jpg")
    const AssociatedTypes = [
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

    // Insert  Frequencies
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
    for (const associatedTypes of AssociatedTypes) {
      await db
        .insert(categoryType)
        .values({
          group: 'ASSOCIATED_TYPE',
          description: associatedTypes.description,
          options: associatedTypes.options,
          isActive: true,
          createdById: 1,
          updatedById: 1,
        })
        .onConflictDoNothing();
    }

    // Insert Payroll Types
    for (const payrollTypes2 of payrollTypes) {
      await db
        .insert(typePayrolls)
        .values({
          code: payrollTypes2.code,
          description: payrollTypes2.description,
          deferredDate: payrollTypes2.deferred_date,
          dateCanceled: payrollTypes2.date_canceled,
          deferredNumber: payrollTypes2.deferred_number,
          numberCanceled: payrollTypes2.number_canceled,
          group: payrollTypes2.group,
          metadata: payrollTypes2.metadata,
          associatedAccount: payrollTypes2.associated_account,
          employerAccount: payrollTypes2.employer_account,
          loanAccount: payrollTypes2.loan_account,
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
