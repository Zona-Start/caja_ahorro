import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrenciesService } from './currencies.service';
import {
  CreateCurrencyDto,
  CurrencyQueryDto,
  UpdateCurrencyDto,
} from './dto/currencies.dto';

@Controller('core/currencies')
export class CurrenciesController {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Get()
  @Permissions({
    resource: 'system:currencies',
    action: 'read',
    scope: 'global',
  })
  async findAll(@Query() dto: CurrencyQueryDto) {
    return this.currenciesService.findAll(dto);
  }

  @Get(':id')
  @Permissions({
    resource: 'system:currencies',
    action: 'read',
    scope: 'global',
  })
  async findOne(@Param('id') id: string) {
    return this.currenciesService.findOne(id);
  }

  @Post()
  @Permissions({
    resource: 'system:currencies',
    action: 'create',
    scope: 'global',
  })
  async create(@Body() dto: CreateCurrencyDto, @Req() req: Request) {
    const userId = this.tenantService.getUserId(req);
    return this.currenciesService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'system:currencies',
    action: 'update',
    scope: 'global',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
    @Req() req: Request,
  ) {
    const userId = this.tenantService.getUserId(req);
    return this.currenciesService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'system:currencies',
    action: 'delete',
    scope: 'global',
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = this.tenantService.getUserId(req);
    return this.currenciesService.remove(id, userId);
  }
}
