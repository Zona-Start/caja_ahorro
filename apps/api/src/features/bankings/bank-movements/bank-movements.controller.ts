import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { BankMovementsService } from './bank-movements.service';
import {
  CreateAndReconcileSchema,
  CreateBankMovementSchema,
  FilterBankMovementSchema,
  GetLinkablesSchema,
  LinkToInternalSchema,
  ReverseMovementSchema,
  UpdateBankMovementSchema,
} from './dto/bank-movements.schema';

@Controller('bankings/bank-movements')
export class BankMovementsController {
  constructor(
    private readonly service: BankMovementsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @UsePipes(new ZodValidatorPipe(FilterBankMovementSchema))
  async findAll(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAll(targetTenantId, dto);
    return {
      message: 'Bank movements fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('linkables')
  @UsePipes(new ZodValidatorPipe(GetLinkablesSchema))
  async getLinkables(
    @Req() req: any,
    @Query('category') category: string,
    @Query() dto: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.getLinkables(
      category,
      targetTenantId,
      dto,
    );
    return {
      message: 'Linkable records fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateBankMovementSchema))
  async create(@Req() req: any, @Body() body: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, body);
    const data = await this.service.create(body, userId, targetTenantId);
    return { message: 'Bank movement created successfully', data };
  }

  @Post('create-and-reconcile')
  @UsePipes(new ZodValidatorPipe(CreateAndReconcileSchema))
  async createAndReconcile(@Req() req: any, @Body() body: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, body);
    const result = await this.service.createAndReconcile(
      body,
      userId,
      targetTenantId,
    );
    return { message: result.message, data: result.movement };
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Bank movement fetched successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ZodValidatorPipe(UpdateBankMovementSchema))
  async update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, body);
    const data = await this.service.update(id, body, userId, targetTenantId);
    return { message: 'Bank movement updated successfully', data };
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }

  @Get(':id/link')
  async findInternalLink(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findInternalLink(id, targetTenantId);
  }

  @Post(':id/reconcile')
  @UsePipes(new ZodValidatorPipe(LinkToInternalSchema))
  async reconcile(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.reconcile(id, dto, userId, targetTenantId);
  }

  @Delete(':id/unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkFromInternalRecord(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    await this.service.unlinkFromInternalRecord(id, targetTenantId);
  }

  @Post(':id/reverse')
  @UsePipes(new ZodValidatorPipe(ReverseMovementSchema))
  async reverse(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.reverse(id, dto, userId, targetTenantId);
  }
}
