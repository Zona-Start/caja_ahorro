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
import { CreateAdvancePaymentDto } from './dto/create-advance-payment.dto';
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

  @Post('advance')
  createAdvancePayment(
    @Req() req: Request,
    @Body() createAdvancePaymentDto: CreateAdvancePaymentDto,
  ) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.createAdvancePayment(
      createAdvancePaymentDto,
      userId,
    );
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

  @Post('massive-payment') // New endpoint
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

  @Post()
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

  @Get()
  findAll(@Query() paginationDto: FilterSupplierPaymentDto) {
    // Use the new DTO
    return this.supplierPaymentsService.findAll(paginationDto);
  }

  // @Get('/by-suppliers')
  // @Roles('admin')
  // @RequirePermissions('read:supplier-payment')
  // @ApiOperation({ summary: 'Get all supplier payment by suppliers' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Return all supplier payment by suppliers',
  // })
  // async findBySuppliers(
  //   @Query('supplierIds', new ParseArrayPipe({ items: Number }))
  //   supplierIds: number[],
  // ) {
  //   const data =
  //     await this.supplierPaymentsService.findAccountsPayableBySuppliers(
  //       supplierIds,
  //     );

  //   return {
  //     message: 'Pagos obtenidas exitosamente.',
  //     data: data,
  //   };
  // }

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

  @Patch(':id/validate')
  validate(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.validate(+id, userId);
  }

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

  @Post(':id/execute')
  execute(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.execute(+id, userId);
  }

  @Post('reverse')
  reverse(@Req() req: Request, @Body() reversePaymentsDto: ReversePaymentsDto) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.reverse(reversePaymentsDto, userId);
  }
}
