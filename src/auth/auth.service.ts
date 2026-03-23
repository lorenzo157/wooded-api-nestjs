import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Users } from '../user/entities/Users';
import * as argon2 from 'argon2';
import { EnvVars } from '../config-loader';

@Injectable()
export class AuthService {
  private readonly pepper: Buffer;

  constructor(
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.pepper = Buffer.from(this.configService.get<string>(EnvVars.passwordPepper));
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 8 * 1024, // 8 MB
      secret: this.pepper,
    });
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain, {
      secret: this.pepper,
    });
  }

  async validateUserByEmail(email: string, pass: string): Promise<Users> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.verifyPassword(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.password = null;
    return user;
  }

  async signPayload(payload: any): Promise<string> {
    return this.jwtService.sign(payload);
  }

  async validateUserById(idUser: number) {
    const user = await this.userService.findUserById(idUser);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      idUser: user.idUser,
      firstName: user.firstName,
      role: user.roleName,
    };
  }

  async validateRoleByUserId(idUser: number, requiredRoles: string[]) {
    const userRole = await this.userService.findRoleByIdUser(idUser);
    return requiredRoles.includes(userRole);
  }
}
