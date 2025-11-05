import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { BankTransactionCategory } from '@/types/enum';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankMovementsService } from './bank-movements.service';
import { CreateAndReconcileDto, QueryBankMovementDto } from './dto';
import { GetLinkablesDto } from './dto/get-linkables.dto';
import { ReverseMovementDto } from './dto/reverse-movement.dto';

@ApiTags('Banking')
@Controller('bank-movements')
export class BankMovementsController {
  constructor(private readonly bankMovementsService: BankMovementsService) {}

  /**
   * findAll
   * Lista movimientos con paginación y filtros por cuenta y rango de fechas.
   * Devuelve total de registros para paginar en el front.
   */
  @Get()
  @RequirePermissions('read:bank-movements')
  @ApiOperation({ summary: 'List all bank movements' })
  @ApiResponse({ status: 200, description: 'A list of bank movements.' })
  async findAll(@Query() query: QueryBankMovementDto) {
    const result = await this.bankMovementsService.findAll(query);

    return {
      message: 'Bank movements fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * createAndReconcile
   * **Crea** el movimiento bancario y **lo reconcilia en la misma transacción**.
   * Se usa cuando el usuario ya sabe con qué documento interno va a vincular
   *
   */
  @Post('create-and-reconcile')
  @RequirePermissions('create:bank-movements')
  @ApiOperation({ summary: 'Create a new bank movement' })
  @ApiResponse({
    status: 201,
    description: 'Bank movement created successfully.',
  })
  async createAndReconcile(
    @Body() body: CreateAndReconcileDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const result = await this.bankMovementsService.createAndReconcile(
      body,
      userId,
    );

    return {
      message: result.message,
      data: result.movement,
    };
  }

  /**
   * GET /bank-movements/linkables
   * Devuelve registros internos pendientes de vincular para una categoría y
   * montos/fechas cercanos al movimiento bancario.
   */
  @Get('linkables')
  async getLinkables(@Query() dto: GetLinkablesDto) {
    const result = await this.bankMovementsService.getLinkablesByCategory(dto);

    return {
      message: 'fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * findOne
   * Devuelve un único movimiento bancario por ID.
   * Lanza 404 si no existe.
   */
  @Get(':id')
  @RequirePermissions('read:bank-movements')
  @ApiOperation({ summary: 'Get a bank movement by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found bank movement.',
  })
  @ApiResponse({ status: 404, description: 'Bank movement not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.findOne(id);
  }

  /**
   * unlinkFromInternalRecord
   * Elimina el vínculo y **reversa** el estado del movimiento y del documento interno.
   * Se usa cuando el usuario des-concilia un movimiento ya cerrado.
   */
  @Delete(':id/unlink')
  @RequirePermissions('delete:bank-movement-links')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink a bank transaction from an internal record',
  })
  @ApiResponse({ status: 204, description: 'Link removed successfully.' })
  unlinkFromInternalRecord(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.unlinkFromInternalRecord(id);
  }

  /**
   * findInternalLink
   * Devuelve el vínculo que tiene un movimiento bancario (si existe).
   * Se usa para validar desvinculaciones o para mostrar detalle.
   */
  @Get(':id/link')
  @RequirePermissions('read:bank-movement-links')
  @ApiOperation({
    summary: 'Find the internal record linked to a bank transaction',
  })
  @ApiResponse({ status: 200, description: 'Link details found.' })
  findInternalLink(@Param('id', ParseIntPipe) id: number) {
    return this.bankMovementsService.findInternalLink(id);
  }

  /**
   * POST /bank-movements/:id/reverse
   * Crea la línea opuesta en el extracto, desvincula el original
   * y genera asiento de reversión.
   */
  @Post(':id/reverse')
  async reverse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReverseMovementDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.bankMovementsService.reverse(id, dto, userId);
  }
}
