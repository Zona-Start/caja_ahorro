export enum FixedAssetStatus {
  ACTIVE = 'ACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  INACTIVE = 'INACTIVE',
  DEREGISTERED = 'DEREGISTERED',
}

export const FIXED_ASSET_STATUS_OPTIONS: Record<FixedAssetStatus, string> = {
  [FixedAssetStatus.ACTIVE]: 'Activo',
  [FixedAssetStatus.UNDER_MAINTENANCE]: 'En Mantenimiento',
  [FixedAssetStatus.INACTIVE]: 'Inactivo',
  [FixedAssetStatus.DEREGISTERED]: 'Dado de Baja',
};

export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DOUBLE_DECLINING = 'DOUBLE_DECLINING',
  SUM_OF_DIGITS = 'SUM_OF_DIGITS',
}

export const DEPRECIATION_METHOD_OPTIONS: Record<
  DepreciationMethod,
  string
> = {
  [DepreciationMethod.STRAIGHT_LINE]: 'Línea Recta',
  [DepreciationMethod.DOUBLE_DECLINING]: 'Doble Saldo Decreciente',
  [DepreciationMethod.SUM_OF_DIGITS]: 'Suma de Dígitos',
};
