export class PermissionDto {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
  createdAt: Date;
}
