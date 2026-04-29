export enum CycleStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING',
}

export const CYCLE_STATUS_OPTIONS = {
  [CycleStatusEnum.OPEN]: 'Abierto',
  [CycleStatusEnum.PENDING]: 'Pendiente',
  [CycleStatusEnum.CLOSED]: 'Cerrado',
};
