export class Audit {
  id: number;
  affectedTable: string;
  action: string;
  recordId: number;
  userId?: number | null;
  details?: JSON | null;
  date: Date | null;
  createdAt?: Date;
  updatedAt?: Date | null;
}
