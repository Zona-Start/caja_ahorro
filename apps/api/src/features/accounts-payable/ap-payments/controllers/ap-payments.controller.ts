import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ApPaymentsService } from '../services/ap-payments.service';
import { CreateApPaymentDto } from '../dto/create-ap-payment.dto';
import { UpdateApPaymentDto } from '../dto/update-ap-payment.dto';
import { FilterApPaymentDto } from '../dto/filter-ap-payment.dto';
import { ApPayment } from '../entities/ap-payment.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';

@ApiTags('accounts-payable/ap-payments')
@Controller('accounts-payable/ap-payments')
export class ApPaymentsController {
  constructor(private readonly apPaymentsService: ApPaymentsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:ap-payment')
  @ApiOperation({ summary: 'Create a new AP payment' })
  @ApiResponse({ status: 201, description: 'AP Payment created successfully.', type: ApPayment })
  async create(@Req() req: Request, @Body() createApPaymentDto: CreateApPaymentDto) {
    const userId = req['user'].id;
    const data = await this.apPaymentsService.create(userId, createApPaymentDto);
    return { message: 'AP Payment created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:ap-payments')
  @ApiOperation({ summary: 'Get all AP payments with pagination and filters' })
  @ApiQuery({ name: 'payableId', required: false, type: Number, description: 'Filter by payable ID (invoice)' })
  @ApiQuery({ name: 'paymentDateStart', required: false, type: String, description: 'Filter by payment date (start)' })
  @ApiQuery({ name: 'paymentDateEnd', required: false, type: String, description: 'Filter by payment date (end)' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, description: 'Filter by payment method' })
  @ApiQuery({ name: 'transactionReference', required: false, type: String, description: 'Filter by transaction reference' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by payment status' })
  @ApiResponse({ status: 200, description: 'Return paginated AP payments.', type: [ApPayment] })
  async findAll(@Query() filterApPaymentDto: FilterApPaymentDto) {
    const result = await this.apPaymentsService.findAll(filterApPaymentDto);
    return { message: 'AP Payments fetched successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:ap-payment')
  @ApiOperation({ summary: 'Get an AP payment by ID' })
  @ApiResponse({ status: 200, description: 'Return the AP payment.', type: ApPayment })
  @ApiResponse({ status: 404, description: 'AP Payment not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.apPaymentsService.findOne(+id);
    return { message: 'AP Payment fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:ap-payment')
  @ApiOperation({ summary: 'Update an AP payment' })
  @ApiResponse({ status: 200, description: 'AP Payment updated successfully.', type: ApPayment })
  @ApiResponse({ status: 404, description: 'AP Payment not found.' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateApPaymentDto: UpdateApPaymentDto) {
    const userId = req['user'].id;
    const data = await this.apPaymentsService.update(userId, +id, updateApPaymentDto);
    return { message: 'AP Payment updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:ap-payment')
  @ApiOperation({ summary: 'Reverse an AP payment' })
  @ApiResponse({ status: 200, description: 'AP Payment reversed successfully.' })
  @ApiResponse({ status: 404, description: 'AP Payment not found.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return await this.apPaymentsService.remove(userId, +id);
  }
}
