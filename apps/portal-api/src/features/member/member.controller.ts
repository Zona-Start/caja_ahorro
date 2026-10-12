import {
  CurrentMember,
  PortalMemberContext,
} from '@/common/decorators/current-member.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MemberMovementQuery,
  MemberPaginationQuery,
} from './dto/member-query.dto';
import { MemberService } from './member.service';

@ApiTags('consulta')
@Controller('me')
export class MemberController {
  constructor(private readonly member: MemberService) {}

  @Get('statement')
  @ApiOperation({ summary: 'Estado de cuenta del asociado autenticado' })
  async statement(@CurrentMember() member: PortalMemberContext) {
    const data = await this.member.getStatement(
      member.associateId,
      member.tenantId,
    );
    return { message: 'Estado de cuenta obtenido exitosamente', data };
  }

  @Get('haberes')
  @ApiOperation({ summary: 'Haberes (aportes) del asociado' })
  async haberes(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberPaginationQuery,
  ) {
    const result = await this.member.getHaberes(
      member.associateId,
      query.page,
      query.limit,
    );
    return { message: 'Haberes obtenidos exitosamente', ...result };
  }

  @Get('retiros')
  @ApiOperation({ summary: 'Retiros del asociado' })
  async retiros(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberPaginationQuery,
  ) {
    const result = await this.member.getRetiros(
      member.associateId,
      query.page,
      query.limit,
    );
    return { message: 'Retiros obtenidos exitosamente', ...result };
  }

  @Get('prestamos')
  @ApiOperation({ summary: 'Préstamos del asociado' })
  async prestamos(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberPaginationQuery,
  ) {
    const result = await this.member.getPrestamos(
      member.associateId,
      member.tenantId,
      query.page,
      query.limit,
    );
    return { message: 'Préstamos obtenidos exitosamente', ...result };
  }

  @Get('creditos')
  @ApiOperation({ summary: 'Créditos del asociado' })
  async creditos(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberPaginationQuery,
  ) {
    const result = await this.member.getCreditos(
      member.associateId,
      member.tenantId,
      query.page,
      query.limit,
    );
    return { message: 'Créditos obtenidos exitosamente', ...result };
  }

  @Get('historial')
  @ApiOperation({ summary: 'Historial de movimientos' })
  async historial(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberPaginationQuery,
  ) {
    const result = await this.member.getHistorial(
      member.associateId,
      query.page,
      query.limit,
    );
    return { message: 'Historial obtenido exitosamente', ...result };
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Movimientos filtrados por tipo' })
  async movimientos(
    @CurrentMember() member: PortalMemberContext,
    @Query() query: MemberMovementQuery,
  ) {
    const result = await this.member.getMovimientosPorTipo(
      member.associateId,
      query.movementType,
      query.page,
      query.limit,
    );
    return { message: 'Movimientos obtenidos exitosamente', ...result };
  }

  @Get('excesos')
  @ApiOperation({ summary: 'Resumen (conteo por tipo) de cobros en exceso' })
  async excesos(@CurrentMember() member: PortalMemberContext) {
    const data = await this.member.getExcesosResumen(member.associateId);
    return {
      message: 'Resumen de cobros en exceso obtenido exitosamente',
      data,
    };
  }

  @Get('prestamo/:loanId')
  @ApiOperation({ summary: 'Detalle de un préstamo propio' })
  async prestamoDetalle(
    @CurrentMember() member: PortalMemberContext,
    @Param('loanId') loanId: string,
  ) {
    const data = await this.member.getPrestamoDetalle(
      member.associateId,
      member.tenantId,
      loanId,
    );
    return { message: 'Detalle del préstamo obtenido exitosamente', data };
  }

  @Get('credito/:creditId')
  @ApiOperation({ summary: 'Detalle de un crédito propio' })
  async creditoDetalle(
    @CurrentMember() member: PortalMemberContext,
    @Param('creditId') creditId: string,
  ) {
    const data = await this.member.getCreditoDetalle(
      member.associateId,
      member.tenantId,
      creditId,
    );
    return { message: 'Detalle del crédito obtenido exitosamente', data };
  }

  @Get('retiro/:withdrawalId')
  @ApiOperation({ summary: 'Detalle de un retiro propio' })
  async retiroDetalle(
    @CurrentMember() member: PortalMemberContext,
    @Param('withdrawalId') withdrawalId: string,
  ) {
    const data = await this.member.getRetiroDetalle(
      member.associateId,
      member.tenantId,
      withdrawalId,
    );
    return { message: 'Detalle del retiro obtenido exitosamente', data };
  }
}
