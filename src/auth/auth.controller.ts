import { Controller, Get, Post, Request, UseGuards, Res } from '@nestjs/common';
import { Request as Req, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local/local-auth.guard'; // We'll create this guard to handle login
import { ApiTags } from '@nestjs/swagger';
import { JWT_COOKIE_OPTIONS } from '../utils/constants';
import { Public } from './public.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Get('check')
  async checkAuth(@Request() req: Req): Promise<{ authenticated: boolean }> {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers?.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken ?? bearerToken;
    if (!token) return { authenticated: false };
    try {
      await this.jwtService.verifyAsync(token);
      return { authenticated: true };
    } catch {
      return { authenticated: false };
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    const payload = { idUser: user.idUser };
    const access_token = await this.authService.signPayload(payload);

    // Set JWT as HttpOnly cookie for web clients
    res.cookie('access_token', access_token, JWT_COOKIE_OPTIONS);

    // Also return token in body for mobile clients
    return {
      user,
      access_token,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: JWT_COOKIE_OPTIONS.httpOnly,
      secure: JWT_COOKIE_OPTIONS.secure,
      sameSite: JWT_COOKIE_OPTIONS.sameSite,
    });
    return { message: 'Logged out' };
  }

  @Get('getStatus')
  async getStatus(@Request() req) {
    return {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query,
    };
  }
}
