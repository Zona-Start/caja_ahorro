import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  movementStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import type { CreateContributionBatchDto } from '../../contribution-batches/dto/contribution-batches.zod.dto';
import type { CreateIndividualLoadDto } from '../dto/individual-load.zod.dto';
import type {
  AssociateMovementPayload,
  AssociateMovementResult,
  BankMovementPayload,
  BankMovementResult,
  BatchAssociateEntry,
  ContributionAssociateType,
  ContributionMovementType,
} from '../schemas/individual-load.types';

/**
 * Determina el tipo de lote (patronal vs voluntario) a partir del tipo
 * de movimiento. Compartido por individual y masivo.
 */
export function resolveContributionMovementType(
  movementType: string,
): ContributionMovementType {
  return movementType === 'EMPLOYER_CONTRIBUTION' ||
    movementType === 'SAVING_DIFFERENCE'
    ? 'contribution_patronal'
    : 'contribution_voluntary';
}

/**
 * Descripción por defecto para una carga según el tipo de movimiento.
 */
export function defaultLoadDescription(
  isEmployerContribution: boolean,
  fullname: string,
): string {
  return `${isEmployerContribution ? 'Carga Aportes Patronales' : 'Carga de haberes Voluntarios'} - ${fullname}`;
}

/**
 * Construye los payloads de movimientos del asociado a partir del DTO.
 *
 * - EMPLOYER_CONTRIBUTION -> 2 payloads (patronal + asociado).
 * - Otros (SAVING_CONTRIBUTION, VOLUNTARY_SAVINGS) -> 1 payload.
 */
export function buildAssociateMovementPayloads(
  dto: Pick<
    CreateIndividualLoadDto,
    | 'associateAccountId'
    | 'movementType'
    | 'amount'
    | 'employerAmount'
    | 'associateAmount'
    | 'transactionDate'
    | 'description'
  >,
  fallbackDescription: string,
): AssociateMovementPayload[] {
  const isEmployerContribution = dto.movementType === 'EMPLOYER_CONTRIBUTION';
  const isSavingsDifference = dto.movementType === 'SAVING_DIFFERENCE';
  const currencyCode = 'VES' as CurrencyCodeEnum;
  const status = 'COMPLETED' as movementStatusEnum;
  const transactionDate = dto.transactionDate ?? new Date();
  const description = dto.description ?? fallbackDescription;

  if (isEmployerContribution) {
    return [
      {
        associateAccountId: dto.associateAccountId,
        movementType: 'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
        amount: dto.employerAmount ?? 0,
        currencyCode,
        transactionDate,
        description: description || 'Aporte Patronal',
        status,
      },
      {
        associateAccountId: dto.associateAccountId,
        movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
        amount: dto.associateAmount ?? 0,
        currencyCode,
        transactionDate,
        description: description || 'Aporte Asociado (Vía Patronal)',
        status,
      },
    ];
  }

  if (isSavingsDifference) {
    return [
      {
        associateAccountId: dto.associateAccountId,
        movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
        amount: dto.amount ?? 0,
        currencyCode,
        transactionDate,
        description: description || 'Diferencia Ahorro del Socio',
        status,
      },
    ];
  }

  return [
    {
      associateAccountId: dto.associateAccountId,
      movementType: dto.movementType as AssociateMovementTypeEnum,
      amount: dto.amount ?? 0,
      currencyCode,
      transactionDate,
      description: description || 'Aporte Voluntario',
      status,
    },
  ];
}

export interface BankPayloadInput {
  bankAccountId: string;
  transactionDate: Date;
  paymentMethod: paymentMethodEnum;
  referenceNumber?: string;
  description?: string;
  fallbackDescription: string;
  creditAmount: number;
}

/**
 * Construye el payload para `bankMovementsService.createAndReconcile` a
 * partir de los datos bancarios y los resultados de movimientos del asociado.
 */
export function buildBankMovementPayload(
  input: BankPayloadInput,
  movementResults: AssociateMovementResult[],
  userId: string,
): BankMovementPayload {
  return {
    movement: {
      bankAccountId: input.bankAccountId,
      transactionDate: input.transactionDate,
      paymentMethod: input.paymentMethod,
      description: input.description ?? input.fallbackDescription,
      bankReference: input.referenceNumber ?? undefined,
      category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
      creditAmount: input.creditAmount,
      debitAmount: 0,
      createdById: userId,
    },
    links: movementResults.map((m) => ({
      internalRecordType: 'MEMBER_CONTRIBUTION' as const,
      internalRecordId: m.data.id,
    })),
  };
}

export function extractBankTransactionId(
  bankResult: BankMovementResult,
): string {
  return String(bankResult.movement.id);
}

interface BuildBatchDtoInput {
  type: 'individual' | 'massive';
  movementType: ContributionMovementType;
  entryDate: Date;
  description?: string;
  fallbackDescription: string;
  associateId?: string;
  amountVoluntario?: number;
  amountPatrono?: number;
  amountAsociado?: number;
  totalAmount: number;
  associateCount: number;
  bankTransactionId?: string;
  bankData?: {
    bankAccountId: string;
    paymentMethod: string;
    referenceNumber?: string;
  };
}

/**
 * Construye el DTO para `ContributionBatchesService.createBatchRecord`.
 * Único punto de armado para individual y masivo.
 */
export function buildCreateBatchDto(
  input: BuildBatchDtoInput,
): CreateContributionBatchDto {
  return {
    type: input.type,
    movementType: input.movementType,
    entryDate: input.entryDate,
    associateId: input.associateId,
    description: input.description ?? input.fallbackDescription,
    amountVoluntario: input.amountVoluntario,
    amountPatrono: input.amountPatrono,
    amountAsociado: input.amountAsociado,
    totalAmount: input.totalAmount,
    associateCount: input.associateCount,
    bankTransactionId: input.bankTransactionId,
    bankData: input.bankData,
  };
}

interface BatchAssociateEntriesInput {
  associateId: string;
  totalAmount: number;
  contributionType?: ContributionAssociateType;
}

/**
 * Construye las entradas de `contribution_batch_associates` para una carga
 * individual (una sola entrada con el monto total y su tipo de aporte).
 */
export function buildIndividualAssociateEntries(
  input: BatchAssociateEntriesInput,
): BatchAssociateEntry[] {
  return [
    {
      associateId: input.associateId,
      amount: input.totalAmount,
      contributionType: input.contributionType ?? 'ASSOCIATED_SAVINGS',
    },
  ];
}
