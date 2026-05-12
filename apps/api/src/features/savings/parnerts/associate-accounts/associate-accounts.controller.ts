import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssociateAccountsService } from './associate-accounts.service';
import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { Request } from 'express';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import {
  UpdateAssociateAccountsSchema,
  UpdateAssociateAccountsDto,
} from './dto/update-associate-accounts.zod.dto';

@ApiTags('savings-banks/associate-accounts')
@UseInterceptors(ReqLogInterceptor)
@Controller('savings-banks/associate-accounts')
export class AssociateAccountsController {
  constructor(
    private readonly associateAccountsService: AssociateAccountsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('/cuentas/:id')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiResponse({ status: 200, description: 'Return the account.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.associateAccountsService.findOne(targetTenantId, id);
    return { message: 'Associate Account fetched successfully', data };
  }

  @Patch('/cuentas/:id')
  @ApiOperation({ summary: 'Update an associate account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Associate Accounts updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Associate Accounts not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidatorPipe(UpdateAssociateAccountsSchema)) dto: UpdateAssociateAccountsDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req, dto);
    const data = await this.associateAccountsService.update(targetTenantId, userId, id, dto);
    return { message: 'Associate Accounts updated successfully', data };
  }
}
