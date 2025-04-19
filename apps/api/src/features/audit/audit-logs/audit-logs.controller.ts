import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('read:audit-logs')
  @ApiOperation({ summary: 'Get all audit records' })
  @ApiResponse({ status: 200, description: 'Return all audit records.' })
  async findAll() {
    const data = await this.auditLogsService.findAll();
    return { message: 'Audit records fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:audit-logs')
  @ApiOperation({ summary: 'Get an audit record by ID' })
  @ApiResponse({ status: 200, description: 'Return the audit record.' })
  @ApiResponse({ status: 404, description: 'Audit record not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.auditLogsService.findOne(+id);
    return { message: 'Audit record fetched successfully', data };
  }





}