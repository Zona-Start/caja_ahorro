import { Module } from '@nestjs/common';
import { RoutePermissionsController } from './route-permissions.controller';
import { RoutePermissionsService } from './route-permissions.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [RoutePermissionsController],
  providers: [RoutePermissionsService],
  exports: [RoutePermissionsService],
})
export class RoutePermissionsModule {}