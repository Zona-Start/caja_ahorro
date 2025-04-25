import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KeySettingSystemDto } from './dto/settings-key.dto';
import { UpdateSettingSystemDto } from './dto/update-setting-system.dto';
import { SettingsSystemService } from './settings-system.service';

@ApiTags('settings-system')
@Controller('core/settings-system')
export class SettingsSystemController {
  constructor(private readonly settingsSystemService: SettingsSystemService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings system' })
  @ApiResponse({ status: 200, description: 'Return all settings system.' })
  async findAll() {
    const data = await this.settingsSystemService.findAll();
    return { message: 'Settings System fetched successfully', data };
  }

  @Get('/group/:group/')
  @ApiOperation({ summary: 'Get all settings system' })
  @ApiResponse({ status: 200, description: 'Return all settings system.' })
  async findAllByGroup(
    @Param('group') group: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.settingsSystemService.findAllByGroup(
      group,
      paginationDto,
    );
    return {
      message: 'Settings System fetchedsuccessfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/key')
  @ApiOperation({ summary: 'Get settings by key' })
  @ApiResponse({ status: 200, description: 'Return the settings system.' })
  @ApiResponse({ status: 404, description: 'Settings not found.' })
  async findKey(@Body() keySettingSystemDto: KeySettingSystemDto) {
    const data = await this.settingsSystemService.findKey(
      keySettingSystemDto.key,
    );
    return { message: 'Settings fetched successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settings by ID' })
  @ApiResponse({ status: 200, description: 'Return the settings system.' })
  @ApiResponse({ status: 404, description: 'Settings not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.settingsSystemService.findOne(+id);
    return { message: 'Settings fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:settings-system')
  @ApiOperation({ summary: 'Update a settings system' })
  @ApiResponse({
    status: 200,
    description: 'Settings System updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Settings System not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateSettingSystemDto: UpdateSettingSystemDto,
  ) {
    const data = await this.settingsSystemService.update(
      +id,
      updateSettingSystemDto,
    );
    return { message: 'Settings System updated successfully', data };
  }
}
