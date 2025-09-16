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
import { AssociatesService } from './associates.service';
import { CreateAssociateAccountsDto } from './dto/create-associate-accounts.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { FilterAssociateDto } from './dto/filter-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@ApiTags('savings-banks/associates')
@Controller('savings-banks/associates')
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:associate')
  @ApiOperation({ summary: 'Create a new associate' })
  @ApiResponse({ status: 201, description: 'Associate created successfully.' })
  async create(
    @Req() req: Request,
    @Body() createAssociateDto: CreateAssociateDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.create(
      userdId,
      createAssociateDto,
    );
    return { message: 'Associate created successfully', data };
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('read:associates')
  @ApiOperation({ summary: 'Get all associates or filter by savings bank ID' })
  @ApiQuery({ name: 'savingsBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all associates.' })
  async findAll(@Query() paginationDto: FilterAssociateDto) {
    const result = await this.associatesService.findAll(paginationDto);
    return {
      message: 'Associates fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  
  @Get('cedula/:cedula')
  @RequirePermissions('read:associate-by-cedula')
  @ApiOperation({ summary: 'Get an associate by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findByCedula(@Param('cedula') cedula: string) {
    const data = await this.associatesService.findByCedula(cedula);
    return { message: 'Associate fetched successfully', data };
  }

  @Get('details/:cedula')
  @RequirePermissions('read:associate-details-by-cedula')
  @ApiOperation({ summary: 'Get associate details by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate details.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async getAssociateDetailsByCedula(@Param('cedula') cedula: string) {
    const data = await this.associatesService.getAssociateDetailsByCedula(cedula);
    return { message: 'Associate details fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:associate')
  @ApiOperation({ summary: 'Get an associate by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.associatesService.findOne(+id);
    return { message: 'Associate fetched successfully', data };
  }



  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:associate')
  @ApiOperation({ summary: 'Update an associate' })
  @ApiResponse({ status: 200, description: 'Associate updated successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAssociateDto: UpdateAssociateDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.update(
      userdId,
      +id,
      updateAssociateDto,
    );
    return { message: 'Associate updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:associate')
  @ApiOperation({ summary: 'Delete an associate' })
  @ApiResponse({ status: 200, description: 'Associate deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async remove(@Param('id') id: string) {
    return await this.associatesService.remove(+id);
  }

  // Associate Accounts
  @Get('/:id/accounts')
  @Roles('admin')
  @RequirePermissions('read:associate-account')
  @ApiOperation({ summary: 'Get an associate accounts by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate accounts.' })
  @ApiResponse({ status: 404, description: 'Associate accounts not found.' })
  async findByIdAssociateAccounts(@Param('id') id: string) {
    const data = await this.associatesService.findByIdAssociateAccounts(+id);
    return { message: 'By ID Associate Accounts fetched successfully', data };
  }

  @Post('/:id/accounts')
  @Roles('admin')
  @RequirePermissions('create:associate-accounts')
  @ApiOperation({ summary: 'Create Associate Accounts' })
  @ApiResponse({
    status: 201,
    description: 'Associate Accounts created successfully.',
  })
  async createAccounts(
    @Req() req: Request,
    @Body() createAssociateAccountsDto: CreateAssociateAccountsDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.createAssociateAccounts(
      userdId,
      createAssociateAccountsDto,
    );
    return { message: 'Associate Accounts created successfully', data };
  }
}
