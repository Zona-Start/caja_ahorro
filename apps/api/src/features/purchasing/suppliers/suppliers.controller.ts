import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
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
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateSupplierSchema,
  FilterSupplierSchema,
  UpdateSupplierSchema,
} from './dto/suppliers.schema';
import { SuppliersService } from './suppliers.service';

@ApiTags('administration/suppliers')
@Controller('administration/suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateSupplierSchema))
  @ApiOperation({ summary: 'Create a new supplier' })
  async create(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.suppliersService.create(targetTenantId, userId, dto);
  }

  @Get('/paginated')
  @UsePipes(new ZodValidatorPipe(FilterSupplierSchema))
  @ApiOperation({ summary: 'Get all suppliers with pagination and filters' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or taxId',
  })
  async findAll(@Req() req: Request, @Query() dto: any) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.suppliersService.findAll(dto, targetTenantId);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Get all suppliers' })
  async findAllSuppliers(@Req() req: Request) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.suppliersService.findAllSuppliers(targetTenantId);
    return { message: 'Supplier fetched successfully', data };
  }

  @Get('/count')
  @ApiOperation({ summary: 'Get supplier count' })
  async findCountSuppliers(@Req() req: Request) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.suppliersService.getSupplierStatus(targetTenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Return the supplier.' })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.suppliersService.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @UsePipes(new ZodValidatorPipe(UpdateSupplierSchema))
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully.' })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.suppliersService.update(targetTenantId, userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.suppliersService.remove(id, targetTenantId);
  }
}
