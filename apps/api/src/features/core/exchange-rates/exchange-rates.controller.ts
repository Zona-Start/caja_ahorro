import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateExchangeRatesDto } from './dto/create-exchange-rates.dto';
import { UpdateExchangeRatesDto } from './dto/update-exchange-rates.dto';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('core/exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:exchange-rates')
  @ApiOperation({ summary: 'Create a new Exchange Rate' })
  @ApiResponse({ status: 201, description: 'Exchange Rate type successfully.' })
  @Post()
  async create(
    @Req() req: Request,
    @Body() createExchangeRatesDto: CreateExchangeRatesDto,
  ) {
    const userId = req['user'].id;
    const data = await this.exchangeRatesService.create(
      userId,
      createExchangeRatesDto,
    );
    return { message: 'Exchange Rate created successfully', data };
  }

  @Get()
  @RequirePermissions('read:exchange-rates')
  @ApiOperation({
    summary: 'Get all Exchange Rate with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Exchange Rate .',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.exchangeRatesService.findAll(paginationDto);
    return {
      message: 'Exchange Rate fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:exchange-rates')
  @ApiOperation({ summary: 'Get a Exchange Rate by ID' })
  @ApiResponse({ status: 200, description: 'Return the Exchange Rate.' })
  @ApiResponse({ status: 404, description: 'User not Exchange Rate.' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.exchangeRatesService.findOne(+id);
    return { message: 'Exchange Rate fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:exchange-rates')
  @ApiOperation({ summary: 'Update a Exchange Rate' })
  @ApiResponse({
    status: 200,
    description: 'Exchange Rate updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Exchange Rate not found.' })
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateExchangeRatesDto: UpdateExchangeRatesDto,
  ) {
    const userId = req['user'].id;
    const data = await this.exchangeRatesService.update(
      +id,
      userId,
      updateExchangeRatesDto,
    );
    return { message: 'Exchange Rate updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:exchange-rates')
  @ApiOperation({ summary: 'Delete a Exchange Rate' })
  @ApiResponse({
    status: 200,
    description: 'Exchange Rate deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Exchange Rate not found.' })
  remove(@Param('id') id: string) {
    return this.exchangeRatesService.remove(+id);
  }
}
