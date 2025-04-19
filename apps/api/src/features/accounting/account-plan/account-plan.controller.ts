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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountPlanService } from './account-plan.service';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { FilterAccountPlanDto } from './dto/filter-account-plan.dto';
import { UpdateAccountPlanDto } from './dto/update-account-plan.dto';

@ApiTags('account-plan')
@Controller('account-plan')
export class AccountPlanController {
  constructor(private readonly accountPlanService: AccountPlanService) {}

  @Post()
  @Roles('superadmin', 'admin')
  @RequirePermissions('create:account-plan')
  @ApiOperation({ summary: 'Create a new account plan' })
  @ApiResponse({
    status: 201,
    description: 'Account plan created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createAccountPlanDto: CreateAccountPlanDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountPlanService.create(
      userId,
      createAccountPlanDto,
    );
    return { message: 'Account plan created successfully', data };
  }

  @Get()
  @RequirePermissions('read:account-plans')
  @ApiOperation({
    summary: 'Get all account plans',
  })
  @ApiResponse({ status: 200, description: 'Return all account plans.' })
  async findAll() {
    const data = await this.accountPlanService.findAll();
    return { message: 'Account plans fetched successfully', data };
  }

  @Get('pagination')
  @RequirePermissions('read:account-plans')
  @ApiOperation({
    summary: 'Get all account plans with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Return paginated account plans .' })
  async findAllByPagination(@Query() paginationDto: FilterAccountPlanDto) {
    const result =
      await this.accountPlanService.findAllByPagination(paginationDto);
    return {
      message: 'account plans fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:account-plan')
  @ApiOperation({ summary: 'Get an account plan by ID' })
  @ApiResponse({ status: 200, description: 'Return the account plan.' })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.accountPlanService.findOne(+id);
    return { message: 'Account plan fetched successfully', data };
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('update:account-plan')
  @ApiOperation({ summary: 'Update an account plan' })
  @ApiResponse({
    status: 200,
    description: 'Account plan updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAccountPlanDto: UpdateAccountPlanDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountPlanService.update(
      userId,
      +id,
      updateAccountPlanDto,
    );
    return { message: 'Account plan updated successfully', data };
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @RequirePermissions('delete:account-plan')
  @ApiOperation({ summary: 'Delete an account plan' })
  @ApiResponse({
    status: 200,
    description: 'Account plan deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async remove(@Param('id') id: string) {
    return await this.accountPlanService.remove(+id);
  }
}
