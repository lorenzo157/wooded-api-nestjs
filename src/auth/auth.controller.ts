import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
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
  async login(@Request() req) {
    // req.user is populated with the authenticated user object by the guard
    const user = req.user; // This is the user object returned by the LocalStrategy
    const payload = { idUser: user.idUser }; // Create JWT payload
    const access_token = await this.authService.signPayload(payload); // Sign the JWT token
    return {
      statusCode: 200,
      result: {
        access_token,
        firstName: user.firstName,
        idUser: user.idUser,
      },
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
