import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('core/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Roles('admin')
  async getAll(@User() user: any) {
    return this.sessionsService.getAll(user.userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  async revokeAll(@User() user: any) {
    await this.sessionsService.revokeAll(user.userId, 'revoked_by_admin');
    return { message: 'All sessions revoked successfully' };
  }
}
