import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import { CreateAssociateAccountsMovementDto } from './dto/create-associate-accounts-movement.dto';
import { UpdateAssociateAccountsMovementDto } from './dto/update-associate-accounts-movement.dto';
import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('savings-banks/associate-accounts-movements')
export class AssociateAccountsMovementsController {
  constructor(private readonly associateAccountsMovementsService: AssociateAccountsMovementsService) {}


  @Post()
  @Roles('admin')
  @RequirePermissions('create:associate-accounts-movements')
  @ApiOperation({ summary: 'Create a new associate account movements' })
  @ApiResponse({ status: 201, description: 'Associate Accounts Movements successfully.' })
  create(@Req() req: Request, @Body() createAssociateAccountsMovementDto: CreateAssociateAccountsMovementDto) {
    const userId = req['user'].id;
    return this.associateAccountsMovementsService.create(userId,createAssociateAccountsMovementDto);
  }

  @Get()
  findAll() {
    return this.associateAccountsMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.associateAccountsMovementsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssociateAccountsMovementDto: UpdateAssociateAccountsMovementDto) {
    return this.associateAccountsMovementsService.update(+id, updateAssociateAccountsMovementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.associateAccountsMovementsService.remove(+id);
  }
}
