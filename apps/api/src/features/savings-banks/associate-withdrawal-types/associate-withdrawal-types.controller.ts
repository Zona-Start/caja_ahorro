import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssociateWithdrawalTypesService } from './associate-withdrawal-types.service';
import { CreateAssociateWithdrawalTypeDto } from './dto/create-associate-withdrawal-type.dto';
import { UpdateAssociateWithdrawalTypeDto } from './dto/update-associate-withdrawal-type.dto';

@ApiTags('savings-banks/associate-withdrawal-types')
@Controller('savings-banks/associate-withdrawal-types')
export class AssociateWithdrawalTypesController {
  constructor(private readonly service: AssociateWithdrawalTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create withdrawal type' })
  @ApiResponse({ status: 201, description: 'Created successfully.' })
  async create(@Body() dto: CreateAssociateWithdrawalTypeDto) {
    const data = await this.service.create(dto);
    return { message: 'Withdrawal type created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all withdrawal types' })
  @ApiResponse({ status: 200, description: 'Return all withdrawal types.' })
  async findAll() {
    const data = await this.service.findAll();
    return { message: 'Withdrawal types fetched successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get withdrawal type by ID' })
  @ApiResponse({ status: 200, description: 'Return withdrawal type.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(+id);
    return { message: 'Withdrawal type fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update withdrawal type' })
  @ApiResponse({ status: 200, description: 'Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssociateWithdrawalTypeDto,
  ) {
    const data = await this.service.update(+id, dto);
    return { message: 'Withdrawal type updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete withdrawal type' })
  @ApiResponse({ status: 200, description: 'Deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(+id);
  }
}
