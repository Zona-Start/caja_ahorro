import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { ResendService } from './resend.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, ResendService],
  exports: [OtpService],
})
export class OtpModule {}
