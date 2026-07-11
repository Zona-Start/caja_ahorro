import * as moment from 'moment';

export const getExpiry = (cant: number) => {
  const createdAt = new Date();
  const expiresAt = moment(createdAt).add(cant, 'days').toDate();
  return expiresAt;
};

export const getExpiryCode = (cant: number) => {
  const createdAt = new Date();
  const expiresAt = moment(createdAt).add(cant, 'seconds').toDate();
  return expiresAt;
};

export function isDateExpired(expiry: Date): boolean {
  const expirationDate = new Date(expiry);
  const currentDate = new Date();
  return expirationDate.getTime() <= currentDate.getTime();
}

export const expirationTimeInSeconds = (cant: number) => {
  const currentTimeInMillis = Date.now();
  const iat = Math.floor(currentTimeInMillis / 1000);
  const expirationTimeInSeconds = cant * 24 * 60 * 60;
  const exp = iat + expirationTimeInSeconds;
  return exp;
};
