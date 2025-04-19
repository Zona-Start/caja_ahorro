import {  PartialType } from '@nestjs/swagger';
import { CreateActivityLogsSystemDto } from './create-activity-logs-system.dto';


export class UpdateActivityLogsSystemDto extends PartialType(CreateActivityLogsSystemDto) {}