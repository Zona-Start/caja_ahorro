export class FixedAssetsMaintenance {
  id: number;
  assetId: number;
  maintenanceDate: Date;
  maintenanceType: string;
  description: string;
  cost: string;
  performedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updatedById?: number;
}