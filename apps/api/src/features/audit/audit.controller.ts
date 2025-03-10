import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:audits')
  @ApiOperation({ summary: 'Get all audit records' })
  @ApiResponse({ status: 200, description: 'Return all audit records.' })
  async findAll() {
    const data = await this.auditService.findAll();
    return { message: 'Audit records fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:audit')
  @ApiOperation({ summary: 'Get an audit record by ID' })
  @ApiResponse({ status: 200, description: 'Return the audit record.' })
  @ApiResponse({ status: 404, description: 'Audit record not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.auditService.findOne(+id);
    return { message: 'Audit record fetched successfully', data };
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:audit')
  @ApiOperation({ summary: 'Create a new audit record' })
  @ApiResponse({ status: 201, description: 'Audit record created successfully.' })
  async create(@Body() createAuditDto: CreateAuditDto) {
    const data = await this.auditService.create(createAuditDto);
    return { message: 'Audit record created successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:audit')
  @ApiOperation({ summary: 'Update an audit record' })
  @ApiResponse({ status: 200, description: 'Audit record updated successfully.' })
  @ApiResponse({ status: 404, description: 'Audit record not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateAuditDto: UpdateAuditDto,
  ) {
    const data = await this.auditService.update(+id, updateAuditDto);
    return { message: 'Audit record updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:audit')
  @ApiOperation({ summary: 'Delete an audit record' })
  @ApiResponse({ status: 200, description: 'Audit record deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Audit record not found.' })
  async remove(@Param('id') id: string) {
    return await this.auditService.remove(+id);
  }
}