import { TenantContextService } from '@/common/services/tenant-context.service';
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
import { Request } from 'express';
import { AccountPlanService } from './account-plan.service';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { FilterAccountPlanDto } from './dto/filter-account-plan.dto';
import { UpdateAccountPlanDto } from './dto/update-account-plan.dto';
import { Permissions } from '@/common/decorators/permissions.decorator';


@ApiTags('account-plan')
@Controller('account-plan')
export class AccountPlanController {
  constructor(
    private readonly accountPlanService: AccountPlanService,
    private readonly tenantService: TenantContextService,
  ) { }

  @Post()
  @Permissions('accounting:chart_of_accounts:create')
  @ApiOperation({ summary: 'Create a new account plan' })
  @ApiResponse({
    status: 201,
    description: 'Account plan created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateAccountPlanDto) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountPlanService.create(
      dto,
      targetTenantId,
      userId,
    );
    return { message: 'Account plan created successfully', data };
  }

  @Get('all')
  @Permissions('accounting:chart_of_accounts:read')
  @ApiOperation({
    summary: 'Get all account plans',
  })
  @ApiResponse({ status: 200, description: 'Return all account plans.' })
  async findAll(@Req() req: Request, @Body() tenantId?: string) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountPlanService.findAll(targetTenantId);
    return { message: 'Account plans fetched successfully', data };
  }

  @Get('pagination')
  @Permissions('accounting:chart_of_accounts:read')
  @ApiOperation({
    summary: 'Get all account plans with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Return paginated account plans .' })
  async findAllByPagination(
    @Req() req: Request,
    @Query() dto: FilterAccountPlanDto,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    const result = await this.accountPlanService.findAllByPagination(
      targetTenantId,
      dto,
    );
    return {
      message: 'account plans fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('accounting:chart_of_accounts:read')
  @ApiOperation({ summary: 'Get an account plan by ID' })
  @ApiResponse({ status: 200, description: 'Return the account plan.' })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountPlanService.findOne(id, targetTenantId);
    return { message: 'Account plan fetched successfully', data };
  }

  @Patch(':id')
  @Permissions('accounting:chart_of_accounts:update')
  @ApiOperation({ summary: 'Update an account plan' })
  @ApiResponse({
    status: 200,
    description: 'Account plan updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAccountPlanDto,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountPlanService.update(
      id,
      targetTenantId,
      userId,
      dto,
    );
    return { message: 'Account plan updated successfully', data };
  }

  @Delete(':id')
  @Permissions('accounting:chart_of_accounts:delete')
  @ApiOperation({ summary: 'Delete an account plan' })
  @ApiResponse({
    status: 200,
    description: 'Account plan deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    return await this.accountPlanService.remove(id, targetTenantId, userId);
  }
}
