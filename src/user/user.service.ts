import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/Users';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Cities } from '../location/entities/Cities';
import { ReadUserDto } from './dto/read-user.dto';
import { Roles } from './entities/Roles';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    @InjectRepository(Cities) private readonly cityRepository: Repository<Cities>,
    @InjectRepository(Roles) private roleRepository: Repository<Roles>,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) {}
  async createUser(createUserDto: CreateUserDto): Promise<Users | boolean> {
    const { email, password, provinceName, cityName, roleName, ...userData } = createUserDto;

    // Check if the email is already in use
    const existingUser = await this.userRepository.findOne({ where: { email: email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const city = await this.cityRepository.findOne({
      where: { cityName: cityName, province: { provinceName: provinceName } },
      relations: ['province'],
    });
    if (!city) {
      throw new BadRequestException('City not found in the specified province');
    }

    const role = await this.roleRepository.findOne({ where: { roleName: roleName } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Hash the password
    const hashedPassword = await this.authService.hashPassword(password);

    // Create the new user entity
    const newUser = this.userRepository.create({
      ...userData,
      email: email,
      password: hashedPassword,
      city: city,
      role: role,
    });

    const save = this.userRepository.save(newUser);
    if (!save) return null;
    else return true;
  }

  async findByEmail(email: string): Promise<Users | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUsers(search?: string): Promise<ReadUserDto[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.city', 'city')
      .leftJoinAndSelect('city.province', 'province')
      .select([
        'user.idUser AS "idUser"',
        'user.firstName AS "firstName"',
        'user.lastName AS "lastName"',
        'user.email AS "email"',
        'role.roleName AS "roleName"',
        'user.phoneNumber AS "phoneNumber"',
        'user.address AS "address"',
        'user.heightMeters AS "heightMeters"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
      ]);

    if (search) {
      const term = search.toLowerCase();
      const isNumeric = !isNaN(Number(search));
      qb.where(
        'LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(user.email) LIKE :term' +
          (isNumeric ? ' OR user.idUser = :id' : ''),
        { term: `%${term}%`, ...(isNumeric && { id: Number(search) }) },
      );
    }

    const users = await qb.getRawMany();

    return users.map((u) => ({
      idUser: u.idUser,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: null,
      roleName: u.roleName ?? 'N/A',
      phoneNumber: u.phoneNumber ?? null,
      address: u.address ?? null,
      heightMeters: u.heightMeters ?? null,
      cityName: u.cityName ?? 'N/A',
      provinceName: u.provinceName ?? 'N/A',
    }));
  }

  async findUserById(idUser: number): Promise<ReadUserDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.city', 'city')
      .leftJoinAndSelect('city.province', 'province')
      .where('user.idUser = :idUser', { idUser })
      .select([
        'user.idUser AS "idUser"',
        'user.firstName AS "firstName"',
        'user.lastName AS "lastName"',
        'user.email AS "email"',
        'user.password AS "password"',
        'role.roleName AS "roleName"',
        'user.phoneNumber AS "phoneNumber"',
        'user.address AS "address"',
        'user.heightMeters AS "heightMeters"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
      ])
      .getRawOne();

    if (!user) {
      return null;
    }

    return {
      idUser: user.idUser,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      roleName: user.roleName || 'N/A',
      phoneNumber: user.phoneNumber || null,
      address: user.address || null,
      heightMeters: user.heightMeters ?? null,
      cityName: user.cityName || 'N/A',
      provinceName: user.provinceName || 'N/A',
    };
  }

  async removeUserById(idUser: number) {
    const user = await this.userRepository.findOne({
      where: { idUser },
      relations: ['projects', 'projectUsers'],
    });

    if (!user) return null;

    if (user.projects?.length > 0) {
      throw new BadRequestException('Cannot delete user: user has created projects');
    }

    if (user.projectUsers?.length > 0) {
      throw new BadRequestException('Cannot delete user: user is assigned to one or more projects');
    }

    await this.userRepository.delete({ idUser });
    return true;
  }

  async updateUserById(idUser: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserById(idUser);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { firstName, lastName, email, phoneNumber, address, heightMeters, cityName, provinceName, roleName, password } = updateUserDto;

    const city = await this.cityRepository.findOne({
      where: { cityName, province: { provinceName } },
      relations: ['province'],
    });

    if (!city) {
      throw new BadRequestException('City not found in the specified province');
    }

    const role = await this.roleRepository.findOne({
      where: { roleName },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    const hashedPassword = password ? await this.authService.hashPassword(password) : null;

    const partialUpdate = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(address && { address }),
      ...(heightMeters !== undefined && { heightMeters }),
      ...(city && { city }),
      ...(role && { role }),
      ...(phoneNumber && { phoneNumber }),
    };

    const result = await this.userRepository.update(idUser, partialUpdate);

    if (result.affected === 0) {
      throw new NotFoundException('Invalid update');
    }

    return result;
  }

  async findAllRoles() {
    const roles = await this.roleRepository
      .createQueryBuilder('roles')
      .select(['roles.idRole AS "idRole"', 'roles.roleName AS "roleName"'])
      .orderBy('roles.roleName')
      .groupBy('roles.idRole')
      .getRawMany();

    return roles;
  }

  async findRoleByIdUser(idUser: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { idUser: idUser },
      relations: ['role'],
    });
    return user.role.roleName;
  }
}
