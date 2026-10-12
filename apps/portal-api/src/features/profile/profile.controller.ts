import {
  CurrentMember,
  PortalMemberContext,
} from '@/common/decorators/current-member.decorator';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileUpdateInput } from './dto/profile-update.dto';
import { ProfileService } from './profile.service';

@ApiTags('perfil')
@Controller('me/profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Datos de perfil del asociado' })
  async get(@CurrentMember() member: PortalMemberContext) {
    const data = await this.profile.getProfile(member);
    return { data };
  }

  @Patch()
  @ApiOperation({
    summary: 'Actualizar datos personales (allowlist, OTP en contacto)',
  })
  async update(
    @CurrentMember() member: PortalMemberContext,
    @Body() dto: ProfileUpdateInput,
  ) {
    const data = await this.profile.updateProfile(member, dto);
    return { message: 'Perfil actualizado', data };
  }
}
