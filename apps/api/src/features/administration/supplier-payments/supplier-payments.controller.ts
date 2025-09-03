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
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import { SupplierPaymentsService } from './supplier-payments.service';

@Controller('administration/supplier-payments')
export class SupplierPaymentsController {
  constructor(
    private readonly supplierPaymentsService: SupplierPaymentsService,
  ) {}

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
  findAll(@Query() query: any) {
    // TODO: Crear un DTO para los query params
    return this.supplierPaymentsService.findAll(query);
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

  @Patch(':id/validate')
  validate(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.validate(+id, userId);
  }

  // @Patch(':id/approve')
  // approve(@Param('id') id: string) {
  //   return this.supplierPaymentsService.approve(+id);
  // }

  @Post(':id/generate-batch')
  generateBatch(@Param('id') id: string) {
    return this.supplierPaymentsService.generateBatch(+id);
  }

  // @Post(':id/process-response')
  // processResponse(@Param('id') id: string, @Body() response: any) { // TODO: Crear DTO para la respuesta del banco
  //   return this.supplierPaymentsService.processResponse(+id, response);
  // }

  @Post(':id/execute')
  execute(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.supplierPaymentsService.execute(+id, userId);
  }

  // @Post(':id/reverse')
  // reverse(@Param('id') id: string) {
  //   return this.supplierPaymentsService.reverse(+id);
  // }
}
