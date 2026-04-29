import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingCyclesService } from './accounting-cycles.service';
import {
  CreateAccountingCycleDto,
  FilterAccountingCycleDto,
  UpdateAccountingCycleDto,
} from './dto/accounting-cycles.schema';

@ApiTags('accounting-cycles')
@Controller('accounting-cycles')
@UseInterceptors(ReqLogInterceptor)
export class AccountingCyclesController {
  constructor(
    private readonly service: AccountingCyclesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new accounting cycle' })
  @ApiResponse({
    status: 201,
    description: 'Accounting Cycle created successfully.',
  })
  async create(@Req() req: any, @Body() dto: CreateAccountingCycleDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(targetTenantId, userId, dto);
    return { message: 'Accounting Cycle created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounting cycles' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Accounting Cycles fetched successfully', data };
  }

  @Get('/paginated')
  @ApiOperation({ summary: 'Get all Accounting Cycles with pagination' })
  async findAllPaginated(
    @Req() req: any,
    @Query() dto: FilterAccountingCycleDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAllPaginated(targetTenantId, dto);
    return {
      message: 'Accounting Cycles fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an Accounting Cycle by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(targetTenantId, id);
    return { message: 'Accounting Cycle fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an Accounting Cycle' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAccountingCycleDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(targetTenantId, userId, id, dto);
    return { message: 'Accounting Cycle updated successfully', data };
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close an Accounting Cycle' })
  async close(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.close(targetTenantId, userId, id);
    return { message: 'Accounting Cycle closed successfully', data };
  }
}
