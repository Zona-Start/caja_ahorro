import { MailModule } from '@/features/mail/mail.module';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
