import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { FilterSupplierPaymentDto } from './dto/filter-supplier-payment.dto'; // Import the new DTO
import { ReversePaymentsDto } from './dto/reverse-payments.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import { SupplierPaymentsService } from './supplier-payments.service';

@Controller('administration/supplier-payments')
export class SupplierPaymentsController {
  constructor(
    private readonly supplierPaymentsService: SupplierPaymentsService,
  ) {}

  @Get('history/accounts-payable/:id')
  @Roles('admin')
  @RequirePermissions('read:supplier-payment')
  @ApiOperation({ summary: 'Get payment history for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return payment history.' })
  async getPaymentHistory(@Param('id') id: string) {
    const result = await this.supplierPaymentsService.getPaymentHistory(+id);
    return {
      message: 'History fetched successfully',
      data: result,
    };
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('create:supplier-payment')
  @ApiOperation({ summary: 'Create a new supplier payment' })
  @ApiResponse({
    status: 201,
    description: 'Supplier payment created successfully.',
  })
  createDraft(
    @Req() req: Request,
    @Body() createSupplierPaymentDto: CreateSupplierPaymentDto,
  ) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.createDraft(
      createSupplierPaymentDto,
      userId,
    );
  }

  @Post('massive-payment') // New endpoint
  @Roles('admin')
  @RequirePermissions('create:supplier-payment')
  @ApiOperation({ summary: 'Create a new supplier payment' })
  @ApiResponse({
    status: 201,
    description: 'Supplier payment created successfully.',
  })
  createMassivePayments(
    @Req() req: Request,
    @Body() createSupplierPaymentDtos: CreateSupplierPaymentDto[], // Expects an array
  ) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.createAndExecuteBulkPayments(
      createSupplierPaymentDtos,
      userId,
    );
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('read:supplier-payment')
  @ApiOperation({ summary: 'Get all supplier payments' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all supplier payments.' })
  findAll(@Query() paginationDto: FilterSupplierPaymentDto) {
    // Use the new DTO
    return this.supplierPaymentsService.findAll(paginationDto);
  }

  @Get('/supplier-available-credits/:id')
  @Roles('admin')
  @RequirePermissions('read:supplier-payment')
  @ApiOperation({ summary: 'Get all supplier available credits' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier supplier available credits.',
  })
  async findSupplierAvailableCredits(@Param('id') id: string) {
    const result =
      await this.supplierPaymentsService.getSupplierAvailableCredits(+id);
    return {
      message: 'Supplier Available Credits fetched successfully',
      data: result,
    };
  }

  @Post('pay')
  createAndExecutePayment(
    @Req() req: Request,
    @Body() createSupplierPaymentDto: CreateSupplierPaymentDto,
  ) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.createAndExecutePayment(
      createSupplierPaymentDto,
      userId,
    );
  }

  @Post('reverse')
  reverse(@Req() req: Request, @Body() reversePaymentsDto: ReversePaymentsDto) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.reverse(reversePaymentsDto, userId);
  }

  @Patch(':id')
  updateDraft(
    @Param('id') id: string,
    @Body() updateSupplierPaymentDto: UpdateSupplierPaymentDto,
  ) {
    return this.supplierPaymentsService.updateDraft(
      +id,
      updateSupplierPaymentDto,
    );
  }

  @Post(':id/execute')
  execute(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.execute(+id, userId);
  }

  @Patch(':id/validate')
  validate(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.validate(+id, userId);
  }

  //   return {
  //     message: 'Pagos obtenidas exitosamente.',
  //     data: data,
  //   };
  // }

  // @Patch(':id/approve')
  // approve(@Param('id') id: string) {
  //   return this.supplierPaymentsService.approve(+id);
  // }

  // @Post(':id/generate-batch')
  // generateBatch(@Param('id') id: string) {
  //   return this.supplierPaymentsService.generateBatch(+id);
  // }

  // @Post(':id/process-response')
  // processResponse(@Param('id') id: string, @Body() response: any) { // TODO: Crear DTO para la respuesta del banco
  //   return this.supplierPaymentsService.processResponse(+id, response);
  // }
}
