import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Users } from '../user/entities/Users';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserByEmail(email: string, pass: string): Promise<Users> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.password = null;
    return user;
  }
  async signPayload(payload: any): Promise<string> {
    return this.jwtService.sign(payload);
  }
  /*async validateUserById(idUser: number) {
        const user = await this.userService.findUserById(idUser);
        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }
    }*/
  async validateUserById(idUser: number) {
    const user = await this.userService.findUserById(idUser);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      idUser: user.idUser,
      firstName: user.firstName,
      role: user.roleName, // 🔹 Asegúrate de que roleName sea el campo correcto
    };
  }
}
