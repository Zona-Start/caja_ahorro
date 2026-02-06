import { envs } from '@/common/config/envs';
import { Env, validateString } from '@/common/utils';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { RefreshTokenDto } from '@/features/auth/dto/refresh-token.dto';
import { SignInUserDto } from '@/features/auth/dto/signIn-user.dto';
import { SignOutUserDto } from '@/features/auth/dto/signOut-user.dto';
import { ValidateUserDto } from '@/features/auth/dto/validate-user.dto';
import AuthTokensInterface from '@/features/auth/interfaces/auth-tokens.interface';
import {
  LoginUserInterface,
  Roles,
} from '@/features/auth/interfaces/login-user.interface';
import RefreshTokenInterface from '@/features/auth/interfaces/refresh-token.interface';
import { MailService } from '@/features/mail/mail.service';
import { User } from '@/features/users/entities/user.entity';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { sessions, userAccessSummary, users } from 'src/database/index';
import { Session } from './interfaces/session.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly mailService: MailService,
  ) {}

  //Decode Tokens
  // Método para decodificar el token y obtener los datos completos
  private decodeToken(token: string): {
    sub: number;
    username?: string;
    iat: number;
    exp: number;
  } {
    try {
      const decoded = this.jwtService.decode(token) as {
        sub: number;
        username?: string;
        iat: number;
        exp: number;
      };

      // Validar que contiene los datos esenciales
      if (!decoded || !decoded.exp || !decoded.iat) {
        throw new Error('Token lacks required fields');
      }

      return decoded;
    } catch (error) {
      // Manejo seguro del tipo unknown
      let errorMessage = 'Failed to decode token';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error decoding token:', errorMessage);
      } else {
        console.error('Unknown error type:', error);
      }

      throw new HttpException(errorMessage, HttpStatus.UNAUTHORIZED);
    }
  }

  async generateTokens(user: User): Promise<AuthTokensInterface> {
    const accessTokenSecret = envs.access_token_secret ?? '';
    const accessTokenExp = envs.access_token_expiration ?? '';
    const refreshTokenSecret = envs.refresh_token_secret ?? '';
    const refreshTokenExp = envs.refresh_token_expiration ?? '';

    if (
      !accessTokenSecret ||
      !accessTokenExp ||
      !refreshTokenSecret ||
      !refreshTokenExp
    ) {
      throw new Error('JWT environment variables are missing or invalid');
    }

    interface JwtPayload {
      sub: number;
      username: string;
    }

    const payload: JwtPayload = {
      sub: Number(user?.id),
      username: user.username ?? '',
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExp,
      } as JwtSignOptions),

      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExp,
      } as JwtSignOptions),
    ]);

    return { access_token, refresh_token };
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
      .where(eq(sessions.userId, parseInt(userId)));

    if (activeSessionsCount.length !== 0) {
      // Elimina sessiones viejsas
      await this.drizzle
        .delete(sessions)
        .where(eq(sessions.userId, parseInt(userId)));
    }

    const session = await this.drizzle.insert(sessions).values({
      sessionToken: sessionInput.sessionToken,
      userId: parseInt(userId),
      expiresAt: sessionInput.expiresAt,
    });
    if (session.rowCount === 0)
      throw new HttpException('Failed to create session', HttpStatus.NOT_FOUND);

    return 'Session created successfully';
  }

  //Find User
  async findUser(username: string): Promise<User | null> {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user[0] as User | null;
  }

  //Find User
  async findUserById(id: number): Promise<User | null> {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user[0] as User | null;
  }

  //Check User Is Already Exists
  async validateUser(dto: ValidateUserDto): Promise<User> {
    const user = await this.findUser(dto.username);
    if (!user) throw new NotFoundException('User not found');
    const isValid = await validateString(
      dto.password,
      user?.password as string,
    );
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  //Find rol user
  async findUserRol(id: number): Promise<Roles[]> {
    const roles = await this.drizzle
      .select({
        id: schema.roles.id,
        role: schema.roles.name,
      })
      .from(schema.usersRole)
      .leftJoin(schema.roles, eq(schema.roles.id, schema.usersRole.roleId))
      .where(eq(schema.usersRole.userId, id));

    if (roles.length === 0) {
      throw new NotFoundException('User not found');
    }

    // Aseguramos que no haya valores nulos
    return roles.map((role) => ({
      id: role.id ?? 0, // Asignamos un valor por defecto (0) si es null
      rol: role.role ?? '', // Asignamos un valor por defecto (cadena vacía) si es null
    }));
  }

  //Sign In User Account
  async signIn(dto: SignInUserDto): Promise<LoginUserInterface> {
    const user = await this.validateUser(dto);
    const tokens = await this.generateTokens(user);
    const decodeAccess = this.decodeToken(tokens.access_token);
    const decodeRefresh = this.decodeToken(tokens.refresh_token);
    const rol = await this.findUserRol(user?.id as number);

    await this.createSession({
      userId: String(user?.id), // Convert number to string
      sessionToken: tokens.refresh_token,
      expiresAt: decodeRefresh.exp,
    });

    return {
      message: 'User signed in successfully',
      user: {
        id: user?.id as number,
        username: user?.username,
        fullname: user?.fullname,
        email: user?.email,
        rol: rol,
      },
      tokens: {
        access_token: tokens.access_token,
        access_expire_in: decodeAccess.exp,
        refresh_token: tokens.refresh_token,
        refresh_expire_in: decodeRefresh.exp,
      },
    };
  }

  // //Forgot Password
  // async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
  //   const user = await this.findUser(dto.username);
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
    const { user_id } = dto;
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, parseInt(user_id)));
    if (!user) throw new NotFoundException('User not found');
    await this.drizzle
      .delete(sessions)
      .where(eq(sessions.userId, parseInt(user_id)));
  }

  //Refresh User Access Token
  // ... imports previos

  //Refresh User Access Token
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenInterface> {
    const { refreshToken } = dto;

    // 1. Validar firma del token (Crypto check)
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: envs.refresh_token_secret,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid Refresh Token Signature');
    }

    const userId = Number(payload.sub); // Es más seguro usar el ID del token que el del DTO

    // 2. Buscar la sesión por UserID (SIN filtrar por token todavía)
    // Esto es clave: traemos la sesión para ver qué está pasando
    const [currentSession] = await this.drizzle
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    if (!currentSession) throw new NotFoundException('Session not found');

    // CONFIGURACIÓN: Tiempo de gracia en milisegundos (ej: 15 segundos)
    const GRACE_PERIOD_MS = 15000;

    // -------------------------------------------------------------------
    // ESCENARIO A: Rotación Normal (El token coincide con el actual)
    // -------------------------------------------------------------------
    if (currentSession.sessionToken === refreshToken) {
      const user = await this.findUserById(userId);
      if (!user) throw new NotFoundException('User not found');

      // Generar nuevos tokens (A -> B)
      const tokensNew = await this.generateTokens(user);
      const decodeAccess = this.decodeToken(tokensNew.access_token);
      const decodeRefresh = this.decodeToken(tokensNew.refresh_token);

      // Actualizamos DB guardando el token "viejo" como "previous"
      await this.drizzle
        .update(sessions)
        .set({
          sessionToken: tokensNew.refresh_token, // Nuevo (B)
          previousSessionToken: refreshToken, // Viejo (A)
          lastRotatedAt: new Date(), // Marca de tiempo
          expiresAt: decodeRefresh.exp,
        })
        .where(eq(sessions.userId, userId));

      return {
        access_token: tokensNew.access_token,
        access_expire_in: decodeAccess.exp,
        refresh_token: tokensNew.refresh_token,
        refresh_expire_in: decodeRefresh.exp,
      };
    }

    // -------------------------------------------------------------------
    // ESCENARIO B: Periodo de Gracia (Condición de Carrera)
    // -------------------------------------------------------------------
    // El token no coincide con el actual, ¿pero coincide con el anterior?
    const isPreviousToken =
      currentSession.previousSessionToken === refreshToken;

    // Calculamos cuánto tiempo ha pasado desde la rotación
    const timeSinceRotation = currentSession.lastRotatedAt
      ? Date.now() - new Date(currentSession.lastRotatedAt).getTime()
      : Infinity;

    if (isPreviousToken && timeSinceRotation < GRACE_PERIOD_MS) {
      // ¡Es una condición de carrera! El usuario envió 'A' pero ya rotamos a 'B'.
      // Le devolvemos 'B' (el actual en DB) para que se sincronice.

      const user = await this.findUserById(userId);

      if (!user) throw new NotFoundException('User not found');

      // Generamos un access token nuevo fresco (barato)
      const accessTokenPayload = { sub: user.id, username: user.username };
      const newAccessToken = await this.jwtService.signAsync(
        accessTokenPayload,
        {
          secret: envs.access_token_secret,
          expiresIn: envs.access_token_expiration,
        } as JwtSignOptions,
      );
      const decodeAccess = this.decodeToken(newAccessToken);

      // IMPORTANTE: Devolvemos el refresh token QUE YA ESTÁ EN LA BASE DE DATOS
      // No generamos uno nuevo para no romper la cadena de la otra petición que ganó.
      return {
        access_token: newAccessToken,
        access_expire_in: decodeAccess.exp,
        refresh_token: currentSession.sessionToken!, // Devolvemos el token 'B'
        refresh_expire_in: currentSession.expiresAt as number,
      };
    }

    // -------------------------------------------------------------------
    // ESCENARIO C: Robo de Token (Reuse Detection)
    // -------------------------------------------------------------------
    // Si el token no es el actual, ni el anterior válido... ALGUIEN LO ROBÓ.
    // O el usuario está intentando reusar un token muy viejo.

    // Medida de seguridad: Borrar todas las sesiones del usuario
    await this.drizzle.delete(sessions).where(eq(sessions.userId, userId));

    throw new UnauthorizedException(
      'Refresh token reuse detected. Access revoked.',
    );
  }

  async access(id: number) {
    return await this.drizzle
      .select()
      .from(userAccessSummary)
      .where(eq(userAccessSummary.userId, id));
  }
}
