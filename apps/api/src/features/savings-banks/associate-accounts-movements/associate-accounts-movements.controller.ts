import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import { CreateAssociateAccountsMovementDto } from './dto/create-associate-accounts-movement.dto';
import { FilterMovementsDto } from './dto/filter-movements.dto';

@Controller('savings-banks/associate-accounts-movements')
export class AssociateAccountsMovementsController {
  constructor(
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) {}

  @Get('haberes/by-associate/:associateId')
  @RequirePermissions('read:haberes-movements-by-associate')
  @ApiOperation({ summary: 'Get all haberes movements for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all haberes movements for the associate.',
  })
  async findAllHaberesByAssociate(
    @Param('associateId') associateId: string,
    @Query() filtersDto: FilterMovementsDto,
  ) {
    const result =
      await this.associateAccountsMovementsService.findAllHaberesByAssociate(
        +associateId,
        filtersDto,
      );

    return {
      message: 'Haberes movements fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('history/by-associate/:associateId')
  @RequirePermissions('read:all-movements-by-associate')
  @ApiOperation({ summary: 'Get all transaction history for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all transaction history for the associate.',
  })
  async findAllTransactionsByAssociate(
    @Param('associateId') associateId: string,
    @Query() filtersDto: FilterMovementsDto,
  ) {
    const result =
      await this.associateAccountsMovementsService.findAllByAssociate(
        +associateId,
        filtersDto,
      );
    return {
      message: 'Transaction history fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
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
