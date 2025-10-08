import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSettlementAssociateDto } from './dto/create-settlement-associate.dto';
import { SettlementAssociateService } from './settlement-associate.service';

@ApiTags('Settlement Associate')
@Controller('savings-banks/settlement-associate')
export class SettlementAssociateController {
  constructor(private readonly service: SettlementAssociateService) {}

  @Post('request')
  @RequirePermissions('create:settlement-associate')
  @ApiOperation({ summary: 'Request an associate settlement' })
  @ApiResponse({
    status: 201,
    description: 'The settlement request has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createRequest(@Req() req: Request, @Body() dto: CreateSettlementAssociateDto) {
    const userId = req['user'].id;
    return this.service.create(dto, userId);
  }

  @Post(':id/approve')
  @RequirePermissions('approve:settlement-associate') // <-- Permiso específico para aprobar
  @ApiOperation({ summary: 'Approve and process an associate settlement' })
  @ApiResponse({
    status: 200,
    description: 'The settlement has been successfully processed.',
  })
  @ApiResponse({ status: 404, description: 'Settlement request not found.' })
  approveRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req['user'].id;
    return this.service.approve(id, userId);
  }

  @Get('approved')
  @RequirePermissions('read:settlement-associate')
  @ApiOperation({ summary: 'Get all settlement aproveed ' })
  @ApiResponse({ status: 200, description: 'Return all settlement aproveed' })
  findSettlementAprovee() {
    return this.service.findSettlementAprovee();
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
