import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
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
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { Municipality } from './entities/municipality.entity';
import { MunicipalitiesService } from './municipalities.service';

@ApiTags('Municipalities')
@Controller('configurations/municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @RequirePermissions('read:municipalities')
  @ApiOperation({ summary: 'Get all municipalities' })
  @ApiResponse({
    status: 200,
    description: 'Return all municipalities',
    type: [Municipality],
  })
  findAll() {
    return this.municipalitiesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @RequirePermissions('read:municipalities')
  @ApiOperation({ summary: 'Get a municipality by id' })
  @ApiResponse({
    status: 200,
    description: 'Return a municipality',
    type: Municipality,
  })
  @ApiResponse({ status: 404, description: 'Municipality not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.municipalitiesService.findOne(id);
  }

  @Get('state/:stateId')
  @Roles('ADMIN', 'USER')
  @RequirePermissions('read:municipalities')
  @ApiOperation({ summary: 'Get municipalities by state id' })
  @ApiResponse({
    status: 200,
    description: 'Return municipalities by state',
    type: [Municipality],
  })
  @ApiResponse({ status: 404, description: 'State not found' })
  findByState(@Param('stateId', ParseIntPipe) stateId: number) {
    return this.municipalitiesService.findByState(stateId);
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:municipalities')
  @ApiOperation({ summary: 'Create a new municipality' })
  @ApiResponse({
    status: 201,
    description: 'Municipality created',
    type: Municipality,
  })
  create(@Body() createMunicipalityDto: CreateMunicipalityDto) {
    return this.municipalitiesService.create(createMunicipalityDto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:municipalities')
  @ApiOperation({ summary: 'Update a municipality' })
  @ApiResponse({
    status: 200,
    description: 'Municipality updated',
    type: Municipality,
  })
  @ApiResponse({ status: 404, description: 'Municipality not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMunicipalityDto: UpdateMunicipalityDto,
  ) {
    return this.municipalitiesService.update(id, updateMunicipalityDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:municipalities')
  @ApiOperation({ summary: 'Delete a municipality' })
  @ApiResponse({ status: 200, description: 'Municipality deleted' })
  @ApiResponse({ status: 404, description: 'Municipality not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.municipalitiesService.remove(id);
  }
}
