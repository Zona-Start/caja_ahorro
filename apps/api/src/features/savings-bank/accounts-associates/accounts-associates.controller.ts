import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountsAssociatesService } from './accounts-associates.service';
import { CreateAccountAssociateDto } from './dto/create-account-associate.dto';
import { UpdateAccountAssociateDto } from './dto/update-account-associate.dto';

@ApiTags('accounts-associates')
@Controller('accounts-associates')
export class AccountsAssociatesController {
  constructor(private readonly accountsAssociatesService: AccountsAssociatesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:account-associate')
  @ApiOperation({ summary: 'Create a new account for an associate' })
  @ApiResponse({ status: 201, description: 'Account created successfully.' })
  async create(@Body() createAccountAssociateDto: CreateAccountAssociateDto) {
    const data = await this.accountsAssociatesService.create(createAccountAssociateDto);
    return { message: 'Account created successfully', data };
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('read:accounts-associates')
  @ApiOperation({ summary: 'Get all accounts or filter by associate ID' })
  @ApiQuery({ name: 'associatedId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all accounts.' })
  async findAll(@Query('associatedId') associatedId?: string) {
    let data;
    if (associatedId) {
      data = await this.accountsAssociatesService.findAllByAssociateId(+associatedId);
    } else {
      data = await this.accountsAssociatesService.findAll();
    }
    return { message: 'Accounts fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:account-associate')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiResponse({ status: 200, description: 'Return the account.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.accountsAssociatesService.findOne(+id);
    return { message: 'Account fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:account-associate')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountAssociateDto: UpdateAccountAssociateDto,
  ) {
    const data = await this.accountsAssociatesService.update(+id, updateAccountAssociateDto);
    return { message: 'Account updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:account-associate')
  @ApiOperation({ summary: 'Delete an account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async remove(@Param('id') id: string) {
    return await this.accountsAssociatesService.remove(+id);
  }
}