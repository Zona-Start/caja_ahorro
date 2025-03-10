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
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountPlanService } from './account-plan.service';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { UpdateAccountPlanDto } from './dto/update-account-plan.dto';

@ApiTags('account-plan')
@Controller('account-plan')
export class AccountPlanController {
  constructor(private readonly accountPlanService: AccountPlanService) {}

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:account-plan')
  @ApiOperation({ summary: 'Create a new account plan' })
  @ApiResponse({
    status: 201,
    description: 'Account plan created successfully.',
  })
  async create(@Body() createAccountPlanDto: CreateAccountPlanDto) {
    const data = await this.accountPlanService.create(createAccountPlanDto);
    return { message: 'Account plan created successfully', data };
  }

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:account-plans')
  @ApiOperation({
    summary: 'Get all account plans or filter by savings bank ID',
  })
  @ApiQuery({ name: 'savingBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all account plans.' })
  async findAll(@Query('savingBankId') savingBankId?: string) {
    let data;
    if (savingBankId) {
      data = await this.accountPlanService.findAllBySavingsBank(+savingBankId);
    } else {
      data = await this.accountPlanService.findAll();
    }
    return { message: 'Account plans fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:account-plan')
  @ApiOperation({ summary: 'Get an account plan by ID' })
  @ApiResponse({ status: 200, description: 'Return the account plan.' })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.accountPlanService.findOne(+id);
    return { message: 'Account plan fetched successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:account-plan')
  @ApiOperation({ summary: 'Update an account plan' })
  @ApiResponse({
    status: 200,
    description: 'Account plan updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account plan not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountPlanDto: UpdateAccountPlanDto,
  ) {
    const data = await this.accountPlanService.update(
      +id,
      updateAccountPlanDto,
    );
    return { message: 'Account plan updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
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
