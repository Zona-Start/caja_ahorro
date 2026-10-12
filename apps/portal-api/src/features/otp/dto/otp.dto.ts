import { otpRequestSchema, otpVerifySchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class OtpRequestInput extends createZodDto(otpRequestSchema) {}
export class OtpVerifyInput extends createZodDto(otpVerifySchema) {}
