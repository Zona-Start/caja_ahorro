export enum CycleStatusEnum {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  CLOSED = 'CLOSED',
}

export const CYCLE_STATUS_OPTIONS: Record<string, string> = {
  [CycleStatusEnum.OPEN]: 'Abierto',
  [CycleStatusEnum.PENDING]: 'Pendiente',
  [CycleStatusEnum.CLOSED]: 'Cerrado',
};

export const CYCLE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: CycleStatusEnum.OPEN, label: 'Abierto' },
  { value: CycleStatusEnum.PENDING, label: 'Pendiente' },
];
