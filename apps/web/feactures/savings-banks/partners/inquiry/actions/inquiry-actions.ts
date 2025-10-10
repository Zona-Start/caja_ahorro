'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  associateDetailsResponseSchema,
  creditDetailsResponseSchema,
  creditsResponseSchema,
  haberesMovementsResponseSchema,
  loanDetailsResponseSchema,
  loansResponseSchema,
  transactionHistoryResponseSchema,
  withdrawalDetailsResponseSchema,
  withdrawalsResponseSchema,
} from '../schemas/inquiry-schema';

export const getWithdrawalDetailsAction = async (withdrawalId: number) => {
  const [error, response] = await safeFetchApi(
    withdrawalDetailsResponseSchema,
    `/savings-banks/withdrawal-associate/${withdrawalId}/details`,
    'GET',
  );
  if (error) throw new Error(error.message || 'Error fetching withdrawal details');
  return response;
};

export const getCreditDetailsAction = async (creditId: number) => {
  const [error, response] = await safeFetchApi(
    creditDetailsResponseSchema,
    `/credit/${creditId}/details`,
    'GET',
  );
  if (error) throw new Error(error.message || 'Error fetching credit details');
  return response;
};

export const getLoanDetailsAction = async (loanId: number) => {
  const [error, response] = await safeFetchApi(
    loanDetailsResponseSchema,
    `/loan/${loanId}/details`,
    'GET',
  );
  if (error) throw new Error(error.message || 'Error fetching loan details');
  return response;
};

export const getAssociateDetailsAction = async (cedula: string) => {
  const [error, response] = await safeFetchApi(
    associateDetailsResponseSchema,
    `/savings-banks/associates/details/${cedula}`,
    'GET',
  );
  if (error) throw new Error(error.message || 'Error fetching associate details');
  return response;
};

export const getHaberesMovementsAction = async (associateId: number) => {
  const [error, response] = await safeFetchApi(
    haberesMovementsResponseSchema,
    `/savings-banks/associate-accounts-movements/haberes/by-associate/${associateId}`,
    'GET',
  );
  if (error) throw new Error(error.message || 'Error fetching haberes movements');
  return response;
};

export const getWithdrawalsAction = async (associateId: number) => {
    const [error, response] = await safeFetchApi(
      withdrawalsResponseSchema,
      `/savings-banks/withdrawal-associate/by-associate/${associateId}`,
      'GET',
    );
    if (error) throw new Error(error.message || 'Error fetching withdrawals');
    return response;
};

export const getTransactionHistoryAction = async (associateId: number) => {
    const [error, response] = await safeFetchApi(
      transactionHistoryResponseSchema,
      `/savings-banks/associate-accounts-movements/history/by-associate/${associateId}`,
      'GET',
    );
    if (error) throw new Error(error.message || 'Error fetching transaction history');
    return response;
};

export const getLoansAction = async (associateId: number) => {
    const [error, response] = await safeFetchApi(
      loansResponseSchema,
      `/loan/by-associate/${associateId}`,
      'GET',
    );
    if (error) throw new Error(error.message || 'Error fetching loans');
    return response;
};

export const getCreditsAction = async (associateId: number) => {
    const [error, response] = await safeFetchApi(
      creditsResponseSchema,
      `/credit/by-associate/${associateId}`,
      'GET',
    );
    if (error) throw new Error(error.message || 'Error fetching credits');
    return response;
};
