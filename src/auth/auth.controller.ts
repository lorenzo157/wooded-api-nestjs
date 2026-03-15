import { Controller, Get, Post, Request, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local/local-auth.guard'; // We'll create this guard to handle login
import { JwtAuthGuard } from './jwt/jwt-auth.guard'; // Used for protecting routes
import { Roles } from './role/role.decorator';
import { ApiTags } from '@nestjs/swagger';
import { JWT_COOKIE_OPTIONS } from '../utils/constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @UseGuards(JwtAuthGuard)
  @Roles('Administrador', 'Gestor')
  @Get('profile')
  async getProfile(@Request() req) {
    return { idUser: req.user }; // Access to the user info after successful JWT validation
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
