import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { BcryptService } from './bcrypt.service';

@Module({
  providers: [
    SecurityService,
    { provide: 'BCRYPT_SERVICE', useClass: BcryptService },
  ],
  exports: [SecurityService, 'BCRYPT_SERVICE'],
})
export class SecurityModule {}