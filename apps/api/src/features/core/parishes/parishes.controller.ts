import { Roles } from '@/common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateParishDto } from './dto/create-parish.dto';
import { UpdateParishDto } from './dto/update-parish.dto';
import { Parish } from './entities/parish.entity';
import { ParishesService } from './parishes.service';

@ApiTags('core/Parishes')
@Controller('core/parishes')
export class ParishesController {
  constructor(private readonly parishesService: ParishesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all parishes' })
  @ApiResponse({
    status: 200,
    description: 'Return all parishes',
    type: [Parish],
  })
  findAll() {
    return this.parishesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parish by id' })
  @ApiResponse({
    status: 200,
    description: 'Return a parish',
    type: Parish,
  })
  @ApiResponse({ status: 404, description: 'Parish not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parishesService.findOne(id);
  }

  @Get('municipality/:municipalityId')
  @ApiOperation({ summary: 'Get parishes by municipality id' })
  @ApiResponse({
    status: 200,
    description: 'Return parishes by municipality',
    type: [Parish],
  })
  @ApiResponse({ status: 404, description: 'Municipality not found' })
  findByMunicipality(
    @Param('municipalityId', ParseIntPipe) municipalityId: number,
  ) {
    return this.parishesService.findByMunicipality(municipalityId);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new parish' })
  @ApiResponse({
    status: 201,
    description: 'Parish created',
    type: Parish,
  })
  create(@Body() createParishDto: CreateParishDto) {
    return this.parishesService.create(createParishDto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a parish' })
  @ApiResponse({
    status: 200,
    description: 'Parish updated',
    type: Parish,
  })
  @ApiResponse({ status: 404, description: 'Parish not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParishDto: UpdateParishDto,
  ) {
    return this.parishesService.update(id, updateParishDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parish' })
  @ApiResponse({ status: 200, description: 'Parish deleted' })
  @ApiResponse({ status: 404, description: 'Parish not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.parishesService.remove(id);
  }
}
