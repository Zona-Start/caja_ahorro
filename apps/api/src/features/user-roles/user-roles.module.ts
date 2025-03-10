import { Module } from '@nestjs/common';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [UserRolesController],
  providers: [UserRolesService],
  exports: [UserRolesService],
})
export class UserRolesModule {}