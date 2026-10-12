import { z } from 'zod';

export const otpPurposeSchema = z.enum([
  'EMAIL_VERIFY',
  'PHONE_VERIFY',
  'RESET',
  'STEP_UP',
]);
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;

export const otpChannelSchema = z.enum(['EMAIL', 'SMS']).default('EMAIL');
export type OtpChannel = z.infer<typeof otpChannelSchema>;

export const otpRequestSchema = z.object({
  purpose: otpPurposeSchema,
  channel: otpChannelSchema.optional(),
  /** Valor a verificar (nuevo email/teléfono). Requerido para cambios de contacto. */
  target: z.string().min(3).max(100).optional(),
});
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  purpose: otpPurposeSchema,
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1).max(20),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  identifier: z.string().min(1).max(20),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
