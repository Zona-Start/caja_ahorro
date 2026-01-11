import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingRulesService } from './accounting-rules.service';
import { CreateAccountingRuleDto } from './dto/create-accounting-rule.dto';
import { UpdateAccountingRuleDto } from './dto/update-accounting-rule.dto';

@ApiTags('accounting-rules')
@Controller('accounting-rules')
export class AccountingRulesController {
  constructor(
    private readonly accountingRulesService: AccountingRulesService,
  ) {}

  @Roles('superadmin', 'admin')
  @RequirePermissions('create:accounting-rule')
  @Post()
  @ApiOperation({ summary: 'Create a new accounting rule' })
  @ApiResponse({
    status: 201,
    description: 'Accounting rule created successfully.',
  })
  create(@Body() createAccountingRuleDto: CreateAccountingRuleDto) {
    return this.accountingRulesService.create(createAccountingRuleDto);
  }

  @Roles('superadmin', 'admin')
  @Get()
  @RequirePermissions('read:accounting-rules')
  @ApiOperation({
    summary: 'Get all accounting rules',
  })
  @ApiResponse({ status: 200, description: 'Return all accounting rules.' })
  findAll(@Query('companyId') companyId: string) {
    return this.accountingRulesService.findAll(+companyId);
  }

  @Roles('superadmin', 'admin')
  @Get(':id')
  @RequirePermissions('read:accounting-rule')
  @ApiOperation({ summary: 'Get a single accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Return a single accounting rule.',
  })
  findOne(@Param('id') id: string) {
    return this.accountingRulesService.findOne(+id);
  }

  @Roles('superadmin', 'admin')
  @Patch(':id')
  @RequirePermissions('update:accounting-rule')
  @ApiOperation({ summary: 'Update an accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Accounting rule updated successfully.',
  })
  update(
    @Param('id') id: string,
    @Body() updateAccountingRuleDto: UpdateAccountingRuleDto,
  ) {
    return this.accountingRulesService.update(+id, updateAccountingRuleDto);
  }

  @Roles('superadmin', 'admin')
  @Delete(':id')
  @RequirePermissions('delete:accounting-rule')
  @ApiOperation({ summary: 'Delete an accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Accounting rule deleted successfully.',
  })
  remove(@Param('id') id: string) {
    return this.accountingRulesService.remove(+id);
  }
}
