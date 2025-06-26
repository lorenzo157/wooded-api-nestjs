import { Controller, Get, Post, Request, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local/local-auth.guard'; // We'll create this guard to handle login
import { JwtAuthGuard } from './jwt/jwt-auth.guard'; // Used for protecting routes
import { Roles } from './role/role.decorator';
import { ApiTags } from '@nestjs/swagger';

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

    // Set JWT as HttpOnly, Secure cookie
    // res.cookie('access_token', access_token, {
    //   httpOnly: true,
    //   secure: true, // set to false if not using HTTPS in dev
    //   sameSite: 'strict',
    //   maxAge: 24 * 60 * 60 * 1000, // 1 day
    // });

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
