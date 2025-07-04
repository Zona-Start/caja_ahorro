import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateWithdrawalAssociateDto } from './dto/create-withdrawal-associate.dto';
import { FilterWithdrawalAssociateDto } from './dto/filter-withdrawal-associate.dto';
import { WithdrawalAssociateService } from './withdrawal-associate.service';

@Controller('savings-banks/withdrawal-associate')
export class WithdrawalAssociateController {
  constructor(private readonly service: WithdrawalAssociateService) {}

  @Post()
  @RequirePermissions('create:withdrawal-associate')
  create(@Req() req: Request, @Body() dto: CreateWithdrawalAssociateDto) {
    const userdId = req['user'].id;
    return this.service.create(dto, userdId);
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

  @Delete(':id')
  @RequirePermissions('delete:withdrawal-associate')
  @ApiOperation({ summary: 'Cancel or reverse a Withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal canceled/reversed successfully.' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.service.remove(+id, userId);
  }
}
