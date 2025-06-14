import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // No additional code is needed, as the base AuthGuard will handle JWT validation using the 'jwt' strategy
}
