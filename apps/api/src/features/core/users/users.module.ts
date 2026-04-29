import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../../audit/audit.module';
import { CryptographyModule } from '../security/cryptography.module';
import { SecurityModule } from '../security/security.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule,
    SecurityModule,
    CryptographyModule,
    AuditModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
