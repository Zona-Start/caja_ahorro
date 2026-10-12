import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint/controlador como público (exento de autenticación). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
