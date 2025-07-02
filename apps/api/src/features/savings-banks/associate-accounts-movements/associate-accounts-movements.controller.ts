import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import { CreateAssociateAccountsMovementDto } from './dto/create-associate-accounts-movement.dto';

@Controller('savings-banks/associate-accounts-movements')
export class AssociateAccountsMovementsController {
  constructor(
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) {}

  @Get()
  findAll() {
    return this.associateAccountsMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.associateAccountsMovementsService.findOne(+id);
  }

  @Post()
  @RequirePermissions('create:associate-accounts-movements')
  @ApiOperation({ summary: 'Create a new associate account movements' })
  @ApiResponse({
    status: 201,
    description: 'Associate Accounts Movements successfully.',
  })
  create(
    @Req() req: Request,
    @Body()
    createAssociateAccountsMovementDto: CreateAssociateAccountsMovementDto,
  ) {
    const userId = req['user'].id;
    return this.associateAccountsMovementsService.create(
      userId,
      createAssociateAccountsMovementDto,
    );
  }
}
