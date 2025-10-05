'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { revalidatePath } from 'next/cache';
import { supplierMutationResponseApiSchema } from '../schemas';
import { CreditDebitNote } from '../schemas/credit-debit-note.schema';

// action para crear notas de credito o debito a cuenta por pagar
export const createCreditDebitNoteAction = async (payload: CreditDebitNote) => {
  const [error, data] = await safeFetchApi(
    supplierMutationResponseApiSchema,
    '/administration/accounts-payable/transaction/credit-debit-note',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating credit/debit note');
  }

  revalidatePath('/administration/accounts-payable');

  return data;
};
