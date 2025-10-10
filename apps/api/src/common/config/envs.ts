import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  HOST: string;
  ALLOW_CORS_URL: string;
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRATION: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRATION: string;
  MAIL_HOST: string;
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
}

const envsSchema = joi
  .object({
    HOST: joi.string().required(),
    ALLOW_CORS_URL: joi.string().required(),
    PORT: joi.number().required(),
    NODE_ENV: joi.string().required(),
    DATABASE_URL: joi.string().required(),
    ACCESS_TOKEN_SECRET: joi.string().required(),
    ACCESS_TOKEN_EXPIRATION: joi.string().required(),
    REFRESH_TOKEN_SECRET: joi.string().required(),
    REFRESH_TOKEN_EXPIRATION: joi.string().required(),
    MAIL_HOST: joi.string(),
    MAIL_USERNAME: joi.string(),
    MAIL_PASSWORD: joi.string(),
  })
  .unknown(true);

console.log('📦 process.env desde Railway:', {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION,
});

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  dataBaseUrl: envVars.DATABASE_URL,
  node_env: envVars.NODE_ENV,
  host: envVars.HOST,
  allow_cors_url: envVars.ALLOW_CORS_URL,
  access_token_secret: envVars.ACCESS_TOKEN_SECRET,
  access_token_expiration: envVars.ACCESS_TOKEN_EXPIRATION,
  refresh_token_secret: envVars.REFRESH_TOKEN_SECRET,
  refresh_token_expiration: envVars.REFRESH_TOKEN_EXPIRATION,
  mail_host: envVars.MAIL_HOST,
  mail_username: envVars.MAIL_USERNAME,
  mail_password: envVars.MAIL_PASSWORD,
};
