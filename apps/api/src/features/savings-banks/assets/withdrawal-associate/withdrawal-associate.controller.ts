import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateWithdrawalAssociateDto } from './dto/create-withdrawal-associate.dto';
import { FilterWithdrawalAssociateDto } from './dto/filter-withdrawal-associate.dto';
import { DisburseWithdrawalAssociateDto } from './dto/disburse-withdrawal-associate.dto';
import { WithdrawalAssociateService } from './withdrawal-associate.service';

@Controller('savings-banks/withdrawal-associate')
export class WithdrawalAssociateController {
  constructor(private readonly service: WithdrawalAssociateService) {}

  @Post()
  @RequirePermissions('create:withdrawal-associate')
  @ApiOperation({ summary: 'Execute a new withdrawal request' })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created successfully.',
  })
  execute(@Req() req: Request, @Body() dto: CreateWithdrawalAssociateDto) {
    const userId = req['user'].id;
    return this.service.execute(dto, userId);
  }

  @Get('approved')
  @RequirePermissions('read:withdrawal-associate')
  @ApiOperation({ summary: 'Get all withdrawal aproveed ' })
  @ApiResponse({ status: 200, description: 'Return all withdrawal aproveed' })
  findWithdrawalAprovee() {
    return this.service.findWithdrawalAprovee();
  }

  @Get()
  @RequirePermissions('read:withdrawal-associate')
  @ApiOperation({
    summary: 'Get all withdrawal or filter by withdrawal associate ',
  })
  @ApiResponse({ status: 200, description: 'Return all withdrawal.' })
  findAll(@Query() paginationDto: FilterWithdrawalAssociateDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('request/:cedula')
  @RequirePermissions('read:withdrawal-associate')
  @ApiOperation({ summary: 'Get one withdrawal associate' })
  @ApiResponse({ status: 200, description: 'Return on withdrawal associate.' })
  @ApiResponse({ status: 404, description: 'withdrawal Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.service.findOneRequest(cedula);
  }

  @Get('by-associate/:associateId')
  @RequirePermissions('read:withdrawals-by-associate')
  @ApiOperation({ summary: 'Get all withdrawals for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all withdrawals for the associate.',
  })
  async findAllByAssociate(
    @Param('associateId') associateId: string,
    @Query() filtersDto: FilterWithdrawalAssociateDto,
  ) {
    const result = await this.service.findAllByAssociate(+associateId, filtersDto);
    return {
      message: 'Withdrawals fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id/details')
  @RequirePermissions('read:withdrawal-associate')
  @ApiOperation({ summary: 'Get withdrawal details by ID' })
  @ApiResponse({ status: 200, description: 'Return withdrawal details.' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  findWithdrawalDetails(@Param('id', ParseIntPipe) id: number) {
    return this.service.findWithdrawalDetails(id);
  }

  @Patch(':id/approve')
  @RequirePermissions('approve:withdrawal-associate')
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal approved/disbursed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  approve(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.service.approve(+id, userId);
  }

  @Patch(':id/disburse')
  @RequirePermissions('disburse:withdrawal-associate')
  @ApiOperation({ summary: 'Disburse an approved withdrawal request' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal disbursed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  disburse(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisburseWithdrawalAssociateDto,
  ) {
    const userId = req['user'].id;
    return this.service.disburse(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('delete:withdrawal-associate')
  @ApiOperation({ summary: 'Cancel or reverse a Withdrawal' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal canceled/reversed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.service.remove(+id, userId);
  }
}
