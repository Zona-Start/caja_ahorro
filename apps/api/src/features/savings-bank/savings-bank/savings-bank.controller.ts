import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller,  Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSavingsBankDto } from './dto/create-savings-bank.dto';
import { UpdateSavingsBankDto } from './dto/update-savings-bank.dto';
import { SavingsBankService } from './savings-bank.service';

@ApiTags('savings-bank')
@Controller('savings-bank')
export class SavingsBankController {
  constructor(private readonly savingsBankService: SavingsBankService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:savings-bank')
  @ApiOperation({ summary: 'Create a new savings bank' })
  @ApiResponse({ status: 201, description: 'Savings bank created successfully.' })
  async create(@Body() createSavingsBankDto: CreateSavingsBankDto) {
    const data = await this.savingsBankService.create(createSavingsBankDto);
    return { message: 'Savings bank created successfully', data };
  }

  @Get()
  @Roles('superadmin')
  @RequirePermissions('read:savings-banks')
  @ApiOperation({ summary: 'Get all savings banks' })
  @ApiResponse({ status: 200, description: 'Return all savings banks.' })
  async findAll() {
    const data = await this.savingsBankService.findAll();
    return { message: 'Savings banks fetched successfully', data };
  }

  // @Get(':id')
  // @Roles('admin')
  // @RequirePermissions('read:savings-bank')
  // @ApiOperation({ summary: 'Get a savings bank by ID' })
  // @ApiResponse({ status: 200, description: 'Return the savings bank.' })
  // @ApiResponse({ status: 404, description: 'Savings bank not found.' })
  // async findOne(@Param('id') id: string) {
  //   const data = await this.savingsBankService.findOne(+id);
  //   return { message: 'Savings bank fetched successfully', data };
  // }

  @Patch(':id')
  @Roles('superadmin')
  @RequirePermissions('update:savings-bank')
  @ApiOperation({ summary: 'Update a savings bank' })
  @ApiResponse({ status: 200, description: 'Savings bank updated successfully.' })
  @ApiResponse({ status: 404, description: 'Savings bank not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateSavingsBankDto: UpdateSavingsBankDto,
  ) {
    const data = await this.savingsBankService.update(+id, updateSavingsBankDto);
    return { message: 'Savings bank updated successfully', data };
  }

  // @Delete(':id')
  // @Roles('superadmin')
  // @RequirePermissions('delete:savings-bank')
  // @ApiOperation({ summary: 'Delete a savings bank' })
  // @ApiResponse({ status: 200, description: 'Savings bank deleted successfully.' })
  // @ApiResponse({ status: 404, description: 'Savings bank not found.' })
  // async remove(@Param('id') id: string) {
  //   return await this.savingsBankService.remove(+id);
  // }
}