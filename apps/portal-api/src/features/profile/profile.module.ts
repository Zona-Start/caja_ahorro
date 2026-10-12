import { Module } from '@nestjs/common';
import { OtpModule } from '../otp/otp.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [OtpModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
