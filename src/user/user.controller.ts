import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  //UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/Users';
//import { JwtAuthGuard } from '../auth/jwt-auth.guard';
//import { RolesGuard } from '../auth/role/role.guard';
//import { Roles } from '../auth/role/role.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReadUserDto } from './dto/read-user.dto';

//UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '#M301: Crea un nuevo usuario' })
  @Post()
  //@Roles('gestor', 'administrador')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({ summary: '#M302: Obtiene todos los usuarios' })
  @Get('all-users')
  async findAllUser() {
    return this.userService.findAllUser();
  }

  @ApiOperation({ summary: '#M303: Buscar usuario por email' })
  @Get('find-by-email/:email')
  async findUserByEmail(@Param('email') email: string): Promise<Users | undefined> {
    return this.userService.findByEmail(email);
  }

  @ApiOperation({ summary: '#M304: Busca usuario por ID' })
  @Get('find/:idUser')
  async findUserById(@Param('idUser') idUser: number): Promise<ReadUserDto> {
    return this.userService.findUserById(idUser);
  }

  @ApiOperation({ summary: '#M305: Actualiza usuario por ID' })
  @Patch('update/:idUser')
  async updateUserById(@Param('idUser') idUser: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserById(idUser, updateUserDto);
  }

  @ApiOperation({ summary: '#M306: Eliminar usuario por ID' })
  @Delete(':idUser')
  async removeUserById(@Param('idUser') idUser: number) {
    return this.userService.removeUserById(idUser);
  }

  @ApiOperation({ summary: '#M309: Busca todos los roles' })
  @Get('roles')
  async getAllRoles() {
    return this.userService.findAllRoles();
  }
}
