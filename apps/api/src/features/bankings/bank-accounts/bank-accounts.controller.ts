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
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/bank-accounts.schema';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@ApiTags('bakings/bank-accounts')
@Controller('bakings/bank-accounts')
export class BankAccountsController {
  constructor(
    private readonly service: BankAccountsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({
    status: 201,
    description: 'Bank account created successfully.',
  })
  async create(@Req() req: any, @Body() dto: CreateBankAccountDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Bank Account created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank accounts' })
  @ApiResponse({ status: 200, description: 'Return all bank accounts.' })
  async findAll(@Req() req: any, @Query('tenantId') tenantId?: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Bank Accounts fetched successfully', data };
  }

  @Get('/paginated')
  @ApiOperation({ summary: 'Get all bank accounts with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated bank accounts.' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterBankAccountDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(dto, targetTenantId);
    return {
      message: 'Bank Accounts fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank account by ID' })
  @ApiResponse({ status: 200, description: 'Return the bank account.' })
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Bank Account fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank account' })
  @ApiResponse({
    status: 200,
    description: 'Bank account updated successfully.',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, dto, targetTenantId);
    return { message: 'Bank Account updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiResponse({
    status: 200,
    description: 'Bank account deleted successfully.',
  })
  async remove(
    @Req() req: any,
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      tenantId,
    );
    return await this.service.remove(id, targetTenantId);
  }
}
