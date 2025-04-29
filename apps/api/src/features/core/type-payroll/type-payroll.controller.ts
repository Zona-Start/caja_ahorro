import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
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
import { CreateTypePayrollDto } from './dto/create-type-payroll.dto';
import { FilterTypePayrollDto } from './dto/filter-type-payroll.dto';
import { UpdateTypePayrollDto } from './dto/update-type-payroll.dto';
import { TypePayrollService } from './type-payroll.service';

@Controller('core/type-payroll')
export class TypePayrollController {
  constructor(private readonly typePayrollService: TypePayrollService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:payroll-type')
  @ApiOperation({ summary: 'Create a new payroll type' })
  @ApiResponse({ status: 201, description: 'Payroll type successfully.' })
  @Post()
  async create(
    @Req() req: Request,
    @Body() createTypePayrollDto: CreateTypePayrollDto,
  ) {
    const userId = req['user'].id;
    const data = await this.typePayrollService.create(
      userId,
      createTypePayrollDto,
    );
    return { message: 'Payroll type  created successfully', data };
  }

  @Get()
  @RequirePermissions('read:payroll-type')
  @ApiOperation({ summary: 'Get all Payrolls type' })
  @ApiResponse({ status: 200, description: 'Return all Payrolls type.' })
  async findAll() {
    const data = await this.typePayrollService.findAll();
    return { message: 'Payrolls type fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:payroll-type')
  @ApiOperation({
    summary: 'Get all Payroll type with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Payroll type .',
  })
  async findAllByPagination(
    @Query() filterTypePayrollDto: FilterTypePayrollDto,
  ) {
    const result =
      await this.typePayrollService.findAllByPagination(filterTypePayrollDto);
    return {
      message: 'Payroll type  fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:payroll-type')
  @ApiOperation({ summary: 'Get a Payrolls type by ID' })
  @ApiResponse({ status: 200, description: 'Return the Payrolls type.' })
  @ApiResponse({ status: 404, description: 'User not Payrolls type.' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.typePayrollService.findOne(+id);
    return { message: 'Payrolls type fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:payroll-type')
  @ApiOperation({ summary: 'Update a Payroll type' })
  @ApiResponse({
    status: 200,
    description: 'Payroll type updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Payroll type not found.' })
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTypePayrollDto: UpdateTypePayrollDto,
  ) {
    const userId = req['user'].id;
    const data = await this.typePayrollService.update(
      +id,
      userId,
      updateTypePayrollDto,
    );
    return { message: 'Payroll type updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:payroll-type')
  @ApiOperation({ summary: 'Delete a Payroll type' })
  @ApiResponse({
    status: 200,
    description: 'Payroll type deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Payroll type not found.' })
  remove(@Param('id') id: string) {
    return this.typePayrollService.remove(+id);
  }
}
