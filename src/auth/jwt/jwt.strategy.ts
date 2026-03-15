import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../../config-loader';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        // Web: check httpOnly cookie first
        if (req?.cookies?.access_token) {
          return req.cookies.access_token;
        }
        // Mobile: fall back to Authorization Bearer header
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      secretOrKey: configService.get(EnvVars.secretKey),
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  async validate(payload: any): Promise<any> {
    const user = await this.authService.validateUserById(+payload.idUser);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      idUser: user.idUser,
      firstName: user.firstName,
      role: user.role,
    };
  }
}
