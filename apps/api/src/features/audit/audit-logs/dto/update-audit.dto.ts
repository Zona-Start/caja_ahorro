import {  PartialType } from '@nestjs/swagger';
import { CreateAuditLogsDto } from './create-audit.dto';


export class UpdateAuditLogsDto extends PartialType(CreateAuditLogsDto) {}