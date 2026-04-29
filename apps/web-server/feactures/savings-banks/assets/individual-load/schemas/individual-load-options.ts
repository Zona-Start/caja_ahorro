export const ASSOCIATE_MOVEMENT_TYPES = {
  EMPLOYER_CONTRIBUTION: 'Aportes Patronales',
  SAVING_CONTRIBUTION: 'Aportes Voluntarios',
} as const;

export type AssociateMovementType = keyof typeof ASSOCIATE_MOVEMENT_TYPES;
