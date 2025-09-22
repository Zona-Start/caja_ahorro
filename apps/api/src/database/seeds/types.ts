import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';

export async function seedCategories(db: NodePgDatabase<typeof schema>) {
  try {
    // withdrawall
    const withdrawall = [
      {
        description: 'Semanal',
        withdrawalPercentage: '80',
        accountDebit: 1,
        expenseAccount: 1,
        administrativeFeePercentage: 6,
      },
    ];

    // Loans Types
    const loans = [
      {
        code: '5501',
        description: 'Aportes Empleado (5501)',
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
      {
        code: '5800',
        description: 'Descuento Caja (5800)',
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
      {
        code: '5502',
        description: 'Prestamo Personales (5502)',
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
      {
        code: '5504',
        description: 'Aportes Empleado (5504)',
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
      {
        code: '5518',
        description: 'Prestamos Afianzados (5518)',
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
      {
        code: '5634',
        description: 'Prestamos Mediano Plazo (5634)',
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
      {
        code: '5635',
        description: 'Prestamos Larzo Plazo (5635)',
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
      {
        code: '0059',
        description: 'Reintegro de Caja (0059)',
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
      {
        code: '0020',
        description: 'Reintegro de Prestamo (0020)',
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
      {
        code: '5022',
        description: 'Credi Salario (5022)',
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
      {
        code: '5025',
        description: 'Crédito Comercial (5025)',
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

    // Credits Types
    const credits = [
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

    // Payroll Types (from the image "tipo_nomina.jpg")
    const payrollTypes = [
      {
        code: '5501',
        description: 'Aportes Empleado (5501)',
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
      {
        code: '5800',
        description: 'Descuento Caja (5800)',
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
      {
        code: '5502',
        description: 'Prestamo Personales (5502)',
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
      {
        code: '5504',
        description: 'Aportes Empleado (5504)',
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
      {
        code: '5518',
        description: 'Prestamos Afianzados (5518)',
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
      {
        code: '5634',
        description: 'Prestamos Mediano Plazo (5634)',
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
      {
        code: '5635',
        description: 'Prestamos Larzo Plazo (5635)',
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
      {
        code: '0059',
        description: 'Reintegro de Caja (0059)',
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
      {
        code: '0020',
        description: 'Reintegro de Prestamo (0020)',
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
      {
        code: '5022',
        description: 'Credi Salario (5022)',
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
      {
        code: '5025',
        description: 'Crédito Comercial (5025)',
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

    // Insert  Frequencies
    // for (const frequency of frequencies) {
    //   await db
    //     .insert(categoryType)
    //     .values({
    //       group: 'DISCOUNT_FREQ',
    //       description: frequency.description,
    //       options: frequency.options,
    //       isActive: true,
    //       createdById: 1,
    //       updatedById: 1,
    //     })
    //     .onConflictDoNothing();
    // }

    // // Insert Associate Types
    // for (const associatedTypes of AssociatedTypes) {
    //   await db
    //     .insert(categoryType)
    //     .values({
    //       group: 'ASSOCIATED_TYPE',
    //       description: associatedTypes.description,
    //       options: associatedTypes.options,
    //       isActive: true,
    //       createdById: 1,
    //       updatedById: 1,
    //     })
    //     .onConflictDoNothing();
    // }

    // // Insert Payroll Types
    // for (const payrollTypes2 of payrollTypes) {
    //   await db
    //     .insert(typePayrolls)
    //     .values({
    //       code: payrollTypes2.code,
    //       description: payrollTypes2.description,
    //       deferredDate: payrollTypes2.deferred_date,
    //       dateCanceled: payrollTypes2.date_canceled,
    //       deferredNumber: payrollTypes2.deferred_number,
    //       numberCanceled: payrollTypes2.number_canceled,
    //       group: payrollTypes2.group,
    //       metadata: payrollTypes2.metadata,
    //       associatedAccount: payrollTypes2.associated_account,
    //       employerAccount: payrollTypes2.employer_account,
    //       loanAccount: payrollTypes2.loan_account,
    //       createdById: 1,
    //       updatedById: 1,
    //     })
    //     .onConflictDoNothing();
    // }

    // Insert Payroll Types
    // for (const payrollTypes2 of payrollTypes) {
    //   await db
    //     .insert(schema.typePayrolls)
    //     .values({
    //       code: payrollTypes2.code,
    //       description: payrollTypes2.description,
    //       deferredDate: payrollTypes2.deferred_date,
    //       dateCanceled: payrollTypes2.date_canceled,
    //       deferredNumber: payrollTypes2.deferred_number,
    //       numberCanceled: payrollTypes2.number_canceled,
    //       group: payrollTypes2.group,
    //       metadata: payrollTypes2.metadata,
    //       associatedAccount: payrollTypes2.associated_account,
    //       employerAccount: payrollTypes2.employer_account,
    //       loanAccount: payrollTypes2.loan_account,
    //       createdById: 1,
    //       updatedById: 1,
    //     })
    //     .onConflictDoNothing();
    // }

    console.log('Category types seeded successfully');
  } catch (error) {
    console.error('Error seeding category types:', error);
  }
}
