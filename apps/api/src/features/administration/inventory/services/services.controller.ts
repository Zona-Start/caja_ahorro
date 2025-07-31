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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('administration/inventory/services')
@Controller('administration/inventory/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:service')
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateServiceDto) {
    const userId = req['user'].id;
    const data = await this.servicesService.create(userId, dto);
    return { message: 'Service created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:services')
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all services.' })
  async findAll(@Query() paginationDto: FilterServiceDto) {
    const result = await this.servicesService.findAll(paginationDto);
    return {
      message: 'Services fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:service')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Return the service.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.servicesService.findOne(+id);
    return { message: 'Service fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:service')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const userId = req['user'].id;
    const data = await this.servicesService.update(userId, +id, dto);
    return { message: 'Service updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:service')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async remove(@Param('id') id: string) {
    return await this.servicesService.remove(+id);
  }
}
