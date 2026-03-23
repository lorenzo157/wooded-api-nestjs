import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReadUserDto } from './dto/read-user.dto';
import { Roles } from '../auth/role/role.decorator';

@ApiTags('User')
@Roles('administrador')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '#M301: Crea un nuevo usuario' })
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({ summary: '#M302: Obtiene usuarios, opcionalmente filtrando por nombre, apellido, email o ID' })
  @Get()
  async findUsers(@Query('q') q?: string): Promise<ReadUserDto[]> {
    return this.userService.findUsers(q);
  }

  @ApiOperation({ summary: '#M309: Busca todos los roles' })
  @Roles('administrador', 'gestor')
  @Get('roles')
  async getAllRoles() {
    return this.userService.findAllRoles();
  }

  @ApiOperation({ summary: '#M304: Busca usuario por ID' })
  @Roles('administrador', 'gestor')
  @Get(':idUser')
  async findUserById(@Param('idUser') idUser: number): Promise<ReadUserDto> {
    return this.userService.findUserById(idUser);
  }

  @ApiOperation({ summary: '#M305: Actualiza usuario por ID' })
  @Patch(':idUser')
  async updateUserById(@Param('idUser') idUser: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserById(idUser, updateUserDto);
  }

  @ApiOperation({ summary: '#M307: Edita el perfil del usuario por ID' })
  @Roles('administrador', 'gestor', 'inspector')
  @Patch(':idUser/profile')
  async editProfile(@Param('idUser') idUser: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserById(idUser, updateUserDto);
  }

  @ApiOperation({ summary: '#M306: Eliminar usuario por ID' })
  @Delete(':idUser')
  async removeUserById(@Param('idUser') idUser: number) {
    return this.userService.removeUserById(idUser);
  }
}
