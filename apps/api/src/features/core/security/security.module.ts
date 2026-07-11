import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { SecurityService } from './security.service';

@Module({
  providers: [
    SecurityService,
    { provide: 'BCRYPT_SERVICE', useClass: BcryptService },
  ],
  exports: [SecurityService, 'BCRYPT_SERVICE'],
})
export class SecurityModule {}
