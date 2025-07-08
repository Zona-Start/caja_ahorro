import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankMovementsService } from './bank-movements.service';
import { CreateBankMovementDto } from './dto';

@ApiTags('Banking')
@Controller('bank-movements')
export class BankMovementsController {
  constructor(private readonly bankMovementsService: BankMovementsService) {}

  @Post()
  @RequirePermissions('create:bank-movements')
  @ApiOperation({ summary: 'Create a new bank movements' })
  @ApiResponse({ status: 201, description: 'Banks movements successfully.' })
  create(@Body() createBankMovementDto: CreateBankMovementDto) {
    return this.bankMovementsService.create(createBankMovementDto);
  }
}
