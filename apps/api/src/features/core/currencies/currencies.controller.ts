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
import { CurrenciesService } from './currencies.service';
import { CreateCurrenciesDto } from './dto/create-currencies.dto';
import { UpdateCurrenciesDto } from './dto/update-currencies.dto';

@Controller('core/currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:currencies')
  @ApiOperation({ summary: 'Create a new currencies' })
  @ApiResponse({ status: 201, description: 'Currencie type successfully.' })
  async create(
    @Req() req: Request,
    @Body() createCurrenciesDto: CreateCurrenciesDto,
  ) {
    const userId = req['user'].id;
    const data = await this.currenciesService.create(
      userId,
      createCurrenciesDto,
    );
    return { message: 'Currencie created successfully', data };
  }

  @Get()
  @RequirePermissions('read:currencies')
  @ApiOperation({
    summary: 'Get all Currencie with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Currencie .',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.currenciesService.findAll(paginationDto);
    return {
      message: 'Currencie fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:currencies')
  @ApiOperation({ summary: 'Get a Currencie by ID' })
  @ApiResponse({ status: 200, description: 'Return the Currencie.' })
  @ApiResponse({ status: 404, description: 'User not Currencie.' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.currenciesService.findOne(+id);
    return { message: 'Currencie fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:currencies')
  @ApiOperation({ summary: 'Update a Currencie' })
  @ApiResponse({
    status: 200,
    description: 'Currencie updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Currencie not found.' })
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCurrenciesDto: UpdateCurrenciesDto,
  ) {
    const userId = req['user'].id;
    const data = await this.currenciesService.update(
      +id,
      userId,
      updateCurrenciesDto,
    );
    return { message: 'Currencie updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:currencies')
  @ApiOperation({ summary: 'Delete a Currencie' })
  @ApiResponse({
    status: 200,
    description: 'Currencie deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Currencie not found.' })
  remove(@Param('id') id: string) {
    return this.currenciesService.remove(+id);
  }
}
