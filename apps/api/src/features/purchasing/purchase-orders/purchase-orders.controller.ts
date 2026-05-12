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
  CreatePurchaseOrderSchema,
  FilterPurchaseOrderSchema,
  FindAllForInvoiceSchema,
  UpdatePurchaseOrderSchema,
} from './dto/purchase-orders.schema';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('administration/purchase-orders')
@Controller('administration/purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly services: PurchaseOrdersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreatePurchaseOrderSchema))
  @ApiOperation({ summary: 'Create a new purchase order' })
  async create(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.services.create(targetTenantId, userId, dto);
    return { message: 'Purchase order created successfully', data };
  }

  @Get('/for-invoice')
  @UsePipes(new ZodValidatorPipe(FindAllForInvoiceSchema))
  @ApiOperation({ summary: 'Get all purchase orders for invoice form' })
  async findAllForInvoice(@Req() req: Request, @Query() params: any) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    const result = await this.services.findAllForInvoice(params, targetTenantId);
    return {
      message: 'Purchase orders fetched successfully',
      data: result,
    };
  }

  @Get('/paginated')
  @UsePipes(new ZodValidatorPipe(FilterPurchaseOrderSchema))
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Req() req: Request, @Query() paginationDto: any) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    const result = await this.services.findAll(paginationDto, targetTenantId);
    return {
      message: 'Purchase orders fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Return the purchase order.' })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.services.findOne(id, targetTenantId);
    return { message: 'Purchase order fetched successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ZodValidatorPipe(UpdatePurchaseOrderSchema))
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.services.update(targetTenantId, userId, id, dto);
    return { message: 'Purchase order updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.services.remove(id, targetTenantId);
  }
}
