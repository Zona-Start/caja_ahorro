export const GROUP_TYPES = {
  ASSOCIATE_TYPE: 'ASSOCIATE_TYPE',
  DISCOUNT_FREQ: 'DISCOUNT_FREQ',
  WORKING_TYPE: 'WORKING_TYPE',
} as const;

export type AccountType = keyof typeof GROUP_TYPES;
