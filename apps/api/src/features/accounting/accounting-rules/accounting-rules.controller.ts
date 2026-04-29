import { ReqLogInterceptor } from '@/common/interceptors';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccountingRulesService } from './accounting-rules.service';
import {
  CreateAccountingRuleDto,
  CreateAccountingRuleSchema,
} from './dto/create-accounting-rule.dto';
import { UpdateAccountingRuleDto } from './dto/update-accounting-rule.dto';

@ApiTags('accounting-rules')
@UseInterceptors(ReqLogInterceptor)
@Controller('accounting-rules')
export class AccountingRulesController {
  constructor(
    private readonly accountingRulesService: AccountingRulesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new accounting rule' })
  @ApiResponse({
    status: 201,
    description: 'Accounting rule created successfully.',
  })
  create(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(CreateAccountingRuleSchema))
    dto: CreateAccountingRuleDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    return this.accountingRulesService.create(targetTenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounting rules' })
  @ApiResponse({ status: 200, description: 'Return all accounting rules.' })
  findAll() {
    const tenantId = this.tenantContext.getTenantId();
    return this.accountingRulesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Return a single accounting rule.',
  })
  findOne(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    return this.accountingRulesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Accounting rule updated successfully.',
  })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAccountingRuleDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    return this.accountingRulesService.update(id, targetTenantId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an accounting rule' })
  @ApiResponse({
    status: 200,
    description: 'Accounting rule deleted successfully.',
  })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    return this.accountingRulesService.remove(id, targetTenantId, userId);
  }
}
