import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingConfigurationsService } from './accounting-configurations.service';
import { CreateAccountingConfigurationDto } from './dto/create-accounting-configuration.dto';
import { FilterAccountingConfigurationDto } from './dto/filter-accounting-configuration.dto';
import { UpdateAccountingConfigurationDto } from './dto/update-accounting-configuration.dto';

@ApiTags('accounting-configurations')
@Controller('accounting-configurations')
export class AccountingConfigurationsController {
  constructor(
    private readonly accountingConfigurationsService: AccountingConfigurationsService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:accounting-configuration')
  @ApiOperation({ summary: 'Create a new accounting configuration' })
  @ApiResponse({
    status: 201,
    description: 'Accounting configuration created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createAccountingConfigurationDto: CreateAccountingConfigurationDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingConfigurationsService.create(
      userId,
      createAccountingConfigurationDto,
    );
    return { message: 'Accounting configuration created successfully', data };
  }

  @Get()
  @RequirePermissions('read:accounting-configurations')
  @ApiOperation({
    summary: 'Get all accounting configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all accounting configurations.',
  })
  async findAll() {
    const data = await this.accountingConfigurationsService.findAll();
    return { message: 'Accounting configurations fetched successfully', data };
  }

  @Get('pagination')
  @RequirePermissions('read:accounting-configurations')
  @ApiOperation({
    summary: 'Get all accounting configurations with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated accounting configurations .',
  })
  async findAllByPagination(
    @Query() paginationDto: FilterAccountingConfigurationDto,
  ) {
    const result =
      await this.accountingConfigurationsService.findAllByPagination(
        paginationDto,
      );
    return {
      message: 'accounting configurations fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:accounting-configuration')
  @ApiOperation({ summary: 'Get an accounting configuration by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the accounting configuration.',
  })
  @ApiResponse({
    status: 404,
    description: 'Accounting configuration not found.',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.accountingConfigurationsService.findOne(+id);
    return { message: 'Accounting configuration fetched successfully', data };
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('update:accounting-configuration')
  @ApiOperation({ summary: 'Update an accounting configuration' })
  @ApiResponse({
    status: 200,
    description: 'Accounting configuration updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Accounting configuration not found.',
  })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAccountingConfigurationDto: UpdateAccountingConfigurationDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingConfigurationsService.update(
      userId,
      +id,
      updateAccountingConfigurationDto,
    );
    return { message: 'Accounting configuration updated successfully', data };
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('delete:accounting-configuration')
  @ApiOperation({ summary: 'Delete an accounting configuration' })
  @ApiResponse({
    status: 200,
    description: 'Accounting configuration deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Accounting configuration not found.',
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = req['user'].id;
    return await this.accountingConfigurationsService.remove(+id, userId);
  }
}
