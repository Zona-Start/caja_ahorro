import { ReqLogInterceptor } from '@/common/interceptors';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccountingBalanceService } from './accounting-balance.service';
import { CloseCycleDto } from './dto/close-cycle.dto';
import { FilterAccountingBalanceDto } from './dto/filter-accounting-balance.dto';
import { InitialLoadDto, InitialLoadSchema } from './dto/initial-load.dto';
import { OpenCycleDto } from './dto/open-cycle.dto';

@ApiTags('accounting-balance')
@UseInterceptors(ReqLogInterceptor)
@Controller('accounting-balance')
export class AccountingBalanceController {
  constructor(
    private readonly accountingBalanceService: AccountingBalanceService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get accounting balances paginated' })
  async findAll(@Req() req: Request, @Query() dto: FilterAccountingBalanceDto) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req, dto);
    return await this.accountingBalanceService.findAllPaginated(
      targetTenantId,
      dto,
    );
  }

  @Get('has-initial-load')
  @ApiOperation({ summary: 'Check if initial load has been performed' })
  async hasInitialLoad(@Req() req: Request) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return await this.accountingBalanceService.hasInitialLoad(targetTenantId);
  }

  @Post('bootstrapping')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Load initial balances (Bootstrapping)' })
  async bootstrapping(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(InitialLoadSchema))
    dto: InitialLoadDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    return await this.accountingBalanceService.bootstrapping(
      userId,
      targetTenantId,
      dto,
      file,
    );
  }

  @Post('close/:id')
  @ApiOperation({ summary: 'Close an accounting cycle (Snapshot)' })
  async closeCycle(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CloseCycleDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    return await this.accountingBalanceService.closeCycle(
      userId,
      targetTenantId,
      id,
      dto,
    );
  }

  @Post('open')
  @ApiOperation({ summary: 'Open a new accounting cycle (Roll-forward)' })
  async openCycle(@Req() req: Request, @Body() dto: OpenCycleDto) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    return await this.accountingBalanceService.openCycle(
      userId,
      targetTenantId,
      dto,
    );
  }
}
