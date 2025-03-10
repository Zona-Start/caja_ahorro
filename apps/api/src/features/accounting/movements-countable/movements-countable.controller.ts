import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMovementCountableDto } from './dto/create-movement-countable.dto';
import { UpdateMovementCountableDto } from './dto/update-movement-countable.dto';
import { MovementsCountableService } from './movements-countable.service';

@ApiTags('movements-countable')
@Controller('movements-countable')
export class MovementsCountableController {
  constructor(
    private readonly movementsCountableService: MovementsCountableService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:movement-countable')
  @ApiOperation({ summary: 'Create a new accounting movement' })
  @ApiResponse({ status: 201, description: 'Movement created successfully.' })
  async create(@Body() createMovementCountableDto: CreateMovementCountableDto) {
    const data = await this.movementsCountableService.create(
      createMovementCountableDto,
    );
    return { message: 'Movement created successfully', data };
  }

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:movements-countable')
  @ApiOperation({
    summary: 'Get all accounting movements or filter by transaction ID',
  })
  @ApiQuery({ name: 'transactionId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all movements.' })
  async findAll(@Query('transactionId') transactionId?: string) {
    let data;
    if (transactionId) {
      data =
        await this.movementsCountableService.findAllByTransactionId(
          transactionId,
        );
    } else {
      data = await this.movementsCountableService.findAll();
    }
    return { message: 'Movements fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:movement-countable')
  @ApiOperation({ summary: 'Get an accounting movement by ID' })
  @ApiResponse({ status: 200, description: 'Return the movement.' })
  @ApiResponse({ status: 404, description: 'Movement not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.movementsCountableService.findOne(+id);
    return { message: 'Movement fetched successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:movement-countable')
  @ApiOperation({ summary: 'Update an accounting movement' })
  @ApiResponse({ status: 200, description: 'Movement updated successfully.' })
  @ApiResponse({ status: 404, description: 'Movement not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateMovementCountableDto: UpdateMovementCountableDto,
  ) {
    const data = await this.movementsCountableService.update(
      +id,
      updateMovementCountableDto,
    );
    return { message: 'Movement updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:movement-countable')
  @ApiOperation({ summary: 'Delete an accounting movement' })
  @ApiResponse({ status: 200, description: 'Movement deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movement not found.' })
  async remove(@Param('id') id: string) {
    return await this.movementsCountableService.remove(+id);
  }
}
