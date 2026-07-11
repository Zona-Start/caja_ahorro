import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ContributionBatchesService } from './contribution-batches.service';
import {
  FilterContributionBatchDto,
  FilterContributionBatchSchema,
} from './dto/contribution-batches.zod.dto';

@ApiTags('savings-banks/contribution-batches')
@Controller('savings-banks/contribution-batches')
@UseInterceptors(ReqLogInterceptor)
export class ContributionBatchesController {
  constructor(
    private readonly contributionBatchesService: ContributionBatchesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @UsePipes(new ZodValidatorPipe(FilterContributionBatchSchema))
  @ApiOperation({ summary: 'Listar lotes de carga de haberes' })
  @ApiResponse({ status: 200, description: 'Lista de lotes' })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterContributionBatchDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.contributionBatchesService.findAll(
      targetTenantId,
      filterDto,
    );

    return {
      message: 'Lotes de carga obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener lote por ID' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.contributionBatchesService.findOne(
      targetTenantId,
      id,
    );

    return { message: 'Lote obtenido correctamente', data };
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Anular carga de haberes' })
  async reverse(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.contributionBatchesService.reverse(targetTenantId, userId, id);
  }
}
