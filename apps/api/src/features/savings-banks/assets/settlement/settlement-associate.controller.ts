import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSettlementAssociateDto } from './dto/create-settlement-associate.dto';
import { SettlementAssociateService } from './settlement-associate.service';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('savings-banks/settlement-associate')
export class SettlementAssociateController {
  constructor(private readonly service: SettlementAssociateService) {}

  @Post()
  @RequirePermissions('create:settlement-associate')
  create(@Req() req: Request, @Body() dto: CreateSettlementAssociateDto) {
    const userdId = req['user'].id;
    return this.service.create(dto, userdId);
  }

  @Get()
  @RequirePermissions('read:settlement-associate')
  @ApiOperation({
    summary: 'Get allsettlement or filter bysettlement associate ',
  })
  @ApiResponse({ status: 200, description: 'Return all settlement.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('request/:cedula')
  @RequirePermissions('read:settlement-associate')
  @ApiOperation({ summary: 'Get one settlement associate' })
  @ApiResponse({ status: 200, description: 'Return on settlement associate.' })
  @ApiResponse({ status: 404, description: 'settlement Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.service.findOneRequest(cedula);
  }
}
