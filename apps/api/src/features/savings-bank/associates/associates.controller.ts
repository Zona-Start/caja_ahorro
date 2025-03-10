import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssociatesService } from './associates.service';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@ApiTags('associates')
@Controller('associates')
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:associate')
  @ApiOperation({ summary: 'Create a new associate' })
  @ApiResponse({ status: 201, description: 'Associate created successfully.' })
  async create(@Body() createAssociateDto: CreateAssociateDto) {
    const data = await this.associatesService.create(createAssociateDto);
    return { message: 'Associate created successfully', data };
  }

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:associates')
  @ApiOperation({ summary: 'Get all associates or filter by savings bank ID' })
  @ApiQuery({ name: 'savingsBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all associates.' })
  async findAll(@Query('savingsBankId') savingsBankId?: string) {
    let data;
    if (savingsBankId) {
      data = await this.associatesService.findAllBySavingsBank(+savingsBankId);
    } else {
      data = await this.associatesService.findAll();
    }
    return { message: 'Associates fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:associate')
  @ApiOperation({ summary: 'Get an associate by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.associatesService.findOne(+id);
    return { message: 'Associate fetched successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:associate')
  @ApiOperation({ summary: 'Update an associate' })
  @ApiResponse({ status: 200, description: 'Associate updated successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateAssociateDto: UpdateAssociateDto,
  ) {
    const data = await this.associatesService.update(+id, updateAssociateDto);
    return { message: 'Associate updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:associate')
  @ApiOperation({ summary: 'Delete an associate' })
  @ApiResponse({ status: 200, description: 'Associate deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async remove(@Param('id') id: string) {
    return await this.associatesService.remove(+id);
  }
}