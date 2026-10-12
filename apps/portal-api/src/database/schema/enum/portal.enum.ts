import { portalSchema } from '../_schemas';

export const portalAccountStatusEnum = portalSchema.enum('account_status', [
  'PENDING_ACTIVATION',
  'ACTIVE',
  'LOCKED',
  'DISABLED',
]);

export const portalOtpPurposeEnum = portalSchema.enum('otp_purpose', [
  'EMAIL_VERIFY',
  'PHONE_VERIFY',
  'RESET',
  'STEP_UP',
]);

export const portalAccessEventEnum = portalSchema.enum('access_event', [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'READ',
  'PROFILE_UPDATE',
  'PASSWORD_CHANGE',
  'OTP_SENT',
]);

export const portalEmailStatusEnum = portalSchema.enum('email_status', [
  'QUEUED',
  'SENT',
  'FAILED',
]);
