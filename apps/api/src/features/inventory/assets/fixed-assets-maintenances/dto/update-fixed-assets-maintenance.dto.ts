import { PartialType } from '@nestjs/swagger';
import { CreateFixedAssetsMaintenanceDto } from './create-fixed-assets-maintenance.dto';

export class UpdateFixedAssetsMaintenanceDto extends PartialType(CreateFixedAssetsMaintenanceDto) {}
