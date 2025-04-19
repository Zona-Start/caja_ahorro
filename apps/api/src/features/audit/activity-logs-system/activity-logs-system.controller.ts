import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLogsSystemService } from './activity-logs-system.service';

@ApiTags('activity-logs-system')
@Controller('activity-logs-system')
export class ActivityLogsSystemController {
  constructor(private readonly activityLogsSystemService: ActivityLogsSystemService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('read:activity-logs-system')
  @ApiOperation({ summary: 'Get all activity system' })
  @ApiResponse({ status: 200, description: 'Return all activity systems.' })
  async findAll() {
    const data = await this.activityLogsSystemService.findAll();
    return { message: 'Activity system  Logs fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:activity-logs-system')
  @ApiOperation({ summary: 'Get an activity system by ID' })
  @ApiResponse({ status: 200, description: 'Return the activity system.' })
  @ApiResponse({ status: 404, description: 'Activity system not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.activityLogsSystemService.findOne(id);
    return { message: 'Activity system  Log fetched successfully', data };
  }





}