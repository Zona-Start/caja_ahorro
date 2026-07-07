import type { BatchAccountingParams } from '../../contribution-batches/contribution-batches-accounting.service';
import type { AccountingItem, ContributionMovementType } from '../schemas/individual-load.types';

export interface BuildAccountingParamsInput {
  movementType: ContributionMovementType;
  entryDate: Date;
  description: string;
  /** Lists de IDs攒 (masivo) o un solo ID (individual). */
  associateIds: string[];
  totalAmount: number;
  amountVoluntario?: number;
  amountPatrono?: number;
  amountAsociado?: number;
  /**
   * Items detallados por asociado (amounts/descriptions por role).
   * Si se provee, prevalece sobre la derivación automática.
   * Usado por createBulk cuando el Excel ya arma los items por row.
   */
  items?: AccountingItem[];
}

/**
 * Único punto de armado de `BatchAccountingParams` para individual y masivo.
 *
 * Para el flujo individual, `associateIds` contiene un solo ID y los amounts
 * son totales. Para el masivo, `associateIds` y `items` listruran cada row.
 *
 * El servicio de contabilidad (`generateContributionEntry`) se encarga de
 * expandir los items a partir de `associateIds` cuando `items` no se provee,
 * por lo que aquí solo normalizamos la entrada.
 */
export function buildContributionAccountingParams(
  input: BuildAccountingParamsInput,
): BatchAccountingParams {
  return {
    movementType: input.movementType,
    entryDate: input.entryDate,
    description: input.description,
    associateId: input.associateIds[0],
    associateIds: input.associateIds,
    totalAmount: input.totalAmount,
    amountVoluntario: input.amountVoluntario,
    amountPatrono: input.amountPatrono,
    amountAsociado: input.amountAsociado,
    items: input.items,
  };
}