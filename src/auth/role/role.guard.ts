import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './role.decorator';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) {
      return true; // Si no hay roles definidos, permitir el acceso.
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    try {
      const token = authHeader.split(' ')[1]; // Extrae el token (Bearer Token)
      const user = this.jwtService.verify(token); // Verifica el JWT
      return requiredRoles.some((role) => user.role.includes(role)); // Verifica si el usuario tiene el rol necesario
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
