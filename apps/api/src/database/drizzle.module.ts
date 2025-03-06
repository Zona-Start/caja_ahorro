import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './drizzle-provider';

@Global()
@Module({
  imports: [],
  providers: [DrizzleProvider],
  exports: [DrizzleProvider],
})
export class DrizzleModule {}
