import {
  CurrentMember,
  PortalMemberContext,
} from '@/common/decorators/current-member.decorator';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { portalAccounts } from '@/database/schema';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { eq } from 'drizzle-orm';
import { OtpRequestInput, OtpVerifyInput } from './dto/otp.dto';
import { OtpService } from './otp.service';

@ApiTags('seguridad')
@Controller('otp')
export class OtpController {
  constructor(
    private readonly otp: OtpService,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
  ) {}

  @Post('request')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar código OTP (correo)' })
  async request(
    @CurrentMember() member: PortalMemberContext,
    @Body() dto: OtpRequestInput,
  ) {
    const account = await this.db.query.portalAccounts.findFirst({
      where: eq(portalAccounts.id, member.accountId),
    });
    if (!account) throw new UnauthorizedException('Cuenta no válida');

    let destination: string | null = null;
    let sendTo = account.email ?? null;

    switch (dto.purpose) {
      case 'EMAIL_VERIFY':
        destination = dto.target ?? account.email;
        sendTo = destination;
        break;
      case 'PHONE_VERIFY':
        destination = dto.target ?? account.phone;
        sendTo = account.email ?? null; // verificación de identidad por correo
        break;
      case 'STEP_UP':
      case 'RESET':
        destination = account.email;
        sendTo = account.email;
        break;
    }

    if (!destination || !sendTo) {
      throw new BadRequestException(
        'No hay un destino disponible para enviar el código',
      );
    }

    await this.otp.requestEmailCode({
      accountId: account.id,
      purpose: dto.purpose,
      destination,
      sendTo,
    });

    return {
      message: 'Si la información es correcta, recibirás un código por correo.',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP' })
  async verify(
    @CurrentMember() member: PortalMemberContext,
    @Body() dto: OtpVerifyInput,
  ) {
    const { destination } = await this.otp.verifyCode({
      accountId: member.accountId,
      purpose: dto.purpose,
      code: dto.code,
    });
    return { verified: true, destination };
  }
}
