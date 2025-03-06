import { Env, hashString, validateString } from '@/common/utils';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { ChangePasswordDto } from '@/features/auth/dto/change-password.dto';
import { ConfirmEmailDto } from '@/features/auth/dto/confirm-email.dto';
import { CreateUserDto } from '@/features/auth/dto/create-user.dto';
import { ForgotPasswordDto } from '@/features/auth/dto/forgot-password.dto';
import { RefreshTokenDto } from '@/features/auth/dto/refresh-token.dto';
import { ResetPasswordDto } from '@/features/auth/dto/reset-password.dto';
import { SignInUserDto } from '@/features/auth/dto/signIn-user.dto';
import { SignOutUserDto } from '@/features/auth/dto/signOut-user.dto';
import { UpdateRefreshTokenDto } from '@/features/auth/dto/update-refresh-token.dto';
import { ValidateUserDto } from '@/features/auth/dto/validate-user.dto';
import AuthTokensInterface from '@/features/auth/interfaces/auth-tokens.interface';
import LoginUserInterface from '@/features/auth/interfaces/login-user.interface';
import RefreshTokenInterface from '@/features/auth/interfaces/refresh-token.interface';
import { MailService } from '@/features/mail/mail.service';
import ChangePasswordMail from '@/features/mail/templates/change-password.mail';
import ConfirmEmailMail from '@/features/mail/templates/confirm-email.mail';
import ForgotPasswordMail from '@/features/mail/templates/forgot-password.mail';
import RegisterMail from '@/features/mail/templates/register.mail';
import SignInMail from '@/features/mail/templates/sign-in.mail';
import { User } from '@/features/users/entities/user.entity';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { and, eq, or } from 'drizzle-orm';
import { users, sessions } from 'src/database/index';
import { Session } from './interfaces/session.interface';
import { expirationTimeInSeconds } from '@/common/utils/dateTimeUtility';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly mailService: MailService,
  ) {}

  //Generate Tokens
  async generateTokens(user: User): Promise<AuthTokensInterface> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          username: user.username,
        },
        {
          secret: this.config.get('ACCESS_TOKEN_SECRET'),
          expiresIn: this.config.get('ACCESS_TOKEN_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          username: user.username,
        },
        {
          secret: this.config.get('REFRESH_TOKEN_SECRET'),
          expiresIn: this.config.get('REFRESH_TOKEN_EXPIRATION'),
        },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  //Generate OTP Code For Email Confirmation
  async generateOTP(length = 6): Promise<string> {
    return crypto
      .randomInt(0, 10 ** length)
      .toString()
      .padStart(length, '0');
  }

  // metodo para crear una session
  private async createSession(sessionInput: Session): Promise<string> {
    const { userId } = sessionInput;
    const activeSessionsCount = await this.drizzle
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId));

    if (activeSessionsCount.length !==0) {
      // Elimina sessiones viejsas
      await this.drizzle.delete(sessions).where(eq(sessions.userId, userId));
    }
    
    const session = await this.drizzle.insert(sessions).values(sessionInput);
    if (session.rowCount === 0)
      throw new HttpException('Failed to create session', HttpStatus.NOT_FOUND);

    return 'Session created successfully';
  }



  //Find User
  async findUser(identifier: string): Promise<User | null> {
    const user =  await this.drizzle.select().from(users).where(eq(users.username, identifier))
     return user[0]
  }

  //Check User Is Already Exists
  async validateUser(dto: ValidateUserDto): Promise<User> {
    const user = await this.findUser(dto.identifier);
    if (!user) throw new NotFoundException('User not found');
    const isValid = await validateString(dto.password, user?.password as string);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }



  //Sign In User Account
  async signIn(dto: SignInUserDto): Promise<LoginUserInterface> {
    const user = await this.validateUser(dto);
    const tokens = await this.generateTokens(user);

    await this.createSession({
      userId: user?.id as string,
      sessionToken: tokens.refresh_token,
      expiresAt: expirationTimeInSeconds(
        parseInt(this.config.get('REFRESH_TOKEN_EXPIRATION') as string),
      ),
    });

    return { data: user, tokens };
  }

  

  // //Forgot Password
  // async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
  //   const user = await this.findUser(dto.identifier);
  //   if (!user) throw new NotFoundException('User not found');
  //   const passwordResetToken = await this.generateOTP();
  //   user.passwordResetToken = passwordResetToken;
  //   user.passwordResetTokenExpires = new Date(
  //     Date.now() + 1000 * 60 * 60 * 24, // 1 day
  //   );
  //   await this.UserRepository.save(user);
  //   await this.mailService.sendEmail({
  //     to: [user.email],
  //     subject: 'Reset Password',
  //     html: ForgotPasswordMail({
  //       name: user.name,
  //       code: passwordResetToken,
  //     }),
  //   });
  // }

  



  //Sign Out User Account
  async signOut(dto: SignOutUserDto): Promise<void> {
    const user = await this.drizzle.select().from(users).where(eq(users.id, dto.user_id))
    if (!user) throw new NotFoundException('User not found');
    await this.drizzle.delete(sessions).where(eq(sessions.userId, dto.user_id))
  }

  //Refresh User Access Token
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenInterface> {
    const session = await this.drizzle.select().from(sessions).where(and(eq(sessions.userId, dto.user_id) && eq(sessions.sessionToken, dto.refresh_token)));
    if (session.length === 0) throw new NotFoundException('session not found');
    const user = this.findUser(dto.user_id)
    const { access_token } = await this.generateTokens(user[0]);
    return {
      access_token,
    };
  }
}
