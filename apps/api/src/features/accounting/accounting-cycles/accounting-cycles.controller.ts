import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingCyclesService } from './accounting-cycles.service';
import { CreateAccountingCycleDto } from './dto/create-accounting-cycle.dto';
import { FilterAccountingCycleDto } from './dto/filter-accounting-cycle.dto';
import { UpdateAccountingCycleDto } from './dto/update-accounting-cycle.dto';

@ApiTags('accounting-cycles')
@Controller('accounting-cycles')
export class AccountingCyclesController {
  constructor(
    private readonly accountingCyclesService: AccountingCyclesService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:accounting-cycle')
  @ApiOperation({ summary: 'Create a new accounting cycle' })
  @ApiResponse({
    status: 201,
    description: 'Accountign Cycle created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createAccountingCycleDto: CreateAccountingCycleDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingCyclesService.create(
      userId,
      createAccountingCycleDto,
    );
    return { message: 'Accouting Cycle created successfully', data };
  }

  @Get()
  @RequirePermissions('read:accounting-cycle')
  @ApiOperation({ summary: 'Get all accounting cycle' })
  @ApiResponse({ status: 200, description: 'Return all accounting cycle.' })
  async findAll() {
    const data = await this.accountingCyclesService.findAll();
    return { message: 'Accouting Cycle fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:accounting-cycle')
  @ApiOperation({
    summary: 'Get all Accouting Cycle with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Accouting Cycle.',
  })
  async findAllPaginated(@Query() paginationDto: FilterAccountingCycleDto) {
    const result =
      await this.accountingCyclesService.findAllPaginated(paginationDto);
    return {
      message: 'Accouting Cycle fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:accounting-cycle')
  @ApiOperation({ summary: 'Get a Accouting Cycle by ID' })
  @ApiResponse({ status: 200, description: 'Return the Accouting Cycle.' })
  @ApiResponse({ status: 404, description: 'User not Accouting Cycle.' })
  async findOne(@Param('id') id: string) {
    const data = await this.accountingCyclesService.findOne(+id);
    return { message: 'Accouting Cycle fetched successfully', data };
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('update:accounting-cycle')
  @ApiOperation({ summary: 'Update a Accouting Cycle' })
  @ApiResponse({
    status: 200,
    description: 'Accouting Cycle updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Accouting Cycle not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAccountingCycleDto: UpdateAccountingCycleDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingCyclesService.update(
      userId,
      +id,
      updateAccountingCycleDto,
    );
    return { message: 'Accouting Cycle updated successfully', data };
  }

  @Patch(':id/close')
  @Roles('admin', 'contable')
  @RequirePermissions('close:accounting-cycle')
  @ApiOperation({ summary: 'Close a Accouting Cycle' })
  @ApiResponse({
    status: 200,
    description: 'Accouting Cycle close successfully.',
  })
  @ApiResponse({ status: 404, description: 'Accouting Cycle not found.' })
  async close(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.accountingCyclesService.close(userId, +id);
    return { message: 'Accouting Cycle closed successfully', data };
  }
}
