export const GROUP_TYPES = {
  ASSOCIATED_TYPE: 'ASSOCIATED_TYPE',
  DISCOUNT_FREQ: 'DISCOUNT_FREQ',
  WORKING_TYPE: 'WORKING_TYPE',
} as const;

export type AccountType = keyof typeof GROUP_TYPES;
