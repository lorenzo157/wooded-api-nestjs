import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/Users';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Cities } from '../shared/entities/Cities';
import { ReadUserDto } from './dto/read-user.dto';
import { Roles } from './entities/Roles';
import { Provinces } from '../shared/entities/Provinces';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { Neighborhoods } from '../unitwork/entities/Neighborhoods';
import { Coordinates } from '../shared/entities/Coordinates';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    @InjectRepository(Provinces) private readonly provinceRepository: Repository<Provinces>,
    @InjectRepository(Cities) private readonly cityRepository: Repository<Cities>,
    @InjectRepository(Roles) private roleRepository: Repository<Roles>,
    @InjectRepository(Neighborhoods) private neighborhoodRepository: Repository<Neighborhoods>,
    @InjectRepository(Coordinates) private coordinateRepository: Repository<Coordinates>,
  ) {}
  async createUser(createUserDto: CreateUserDto): Promise<Users | boolean> {
    const { email, password, provinceName, cityName, roleName, phoneNumber, ...userData } = createUserDto;

    // Check if the email is already in use
    const existingUser = await this.userRepository.findOne({ where: { email: email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const province = await this.provinceRepository.findOne({ where: { provinceName: provinceName } });
    if (!province) {
      throw new BadRequestException('Province not found');
    }
    // Find the city by name within the given province
    const city = await this.cityRepository.findOne({
      where: { cityName: cityName, province: province },
    });
    if (!city) {
      throw new BadRequestException('City not found in the specified province');
    }

    const role = await this.roleRepository.findOne({ where: { roleName: roleName } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Create the new user entity
    const newUser = this.userRepository.create({
      ...userData,
      email: email,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      city: city,
      role: role,
    });

    const save = this.userRepository.save(newUser);
    if (!save) return null;
    else return true;
  }

  async findByEmail(email: string): Promise<Users | undefined> {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });
    return user;
  }

  async findAllUser() {
    const users = await this.userRepository.find();
    if (!users) return null;
    return users;
  }

  async findUserEntityById(idUser: number): Promise<Users> {
    return await this.userRepository.findOne({
      where: { idUser: idUser },
    });
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
        'user.phoneNumber AS "phoneNumber"',
        'user.address AS "address"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
        'role.roleName AS "roleName"',
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
      cityName: user.cityName || 'N/A',
      provinceName: user.provinceName || 'N/A',
    };
  }

  async findAllProvinces() {
    const provinces = await this.provinceRepository
      .createQueryBuilder('province')
      .select(['province.provinceName AS "provinceName"', 'province.idProvince AS "idProvince"'])
      .orderBy('province.provinceName')
      .getRawMany();

    if (!provinces) {
      return null;
    }
    return provinces;
  }

  async removeUserById(idUser: number) {
    const user = await this.userRepository.findOne({
      where: { idUser: idUser },
    });

    if (!user) return null;
    await this.userRepository.delete({ idUser });
  }

  async updateUserById(idUser: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserById(idUser);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { firstName, lastName, email, phoneNumber, address } = updateUserDto;

    const city = await this.cityRepository.findOne({
      where: { idCity: updateUserDto.idCity },
    });

    if (!city) {
      throw new BadRequestException('City not found in the specified province');
    }

    const role = await this.roleRepository.findOne({
      where: { idRole: updateUserDto.idRole },
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Hash new password

    const password = await this.hashPassword(updateUserDto.password);

    const partialUpdate = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(password && { password }),
      ...(address && { address }),
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

  async createNeighborhood(createNeighborhoodDto: CreateNeighborhoodDto) {
    // Create the new neighborhood

    const city = await this.cityRepository.findOne({
      where: { idCity: createNeighborhoodDto.idCity },
    });

    if (!city) {
      throw new BadRequestException('City not found');
    }

    const newNeighborhood = await this.neighborhoodRepository.save({
      city: city,
      neighborhoodName: createNeighborhoodDto.neighborhoodName,
      numBlocksInNeighborhood: createNeighborhoodDto.numBlocksInNeighborhood,
    });

    for (const coordinate of createNeighborhoodDto.coordinates) {
      const coordinateSaved = await this.coordinateRepository.save({
        neighborhood: newNeighborhood,
        latitude: coordinate.lat,
        longitude: coordinate.lng,
      });
      if (!coordinateSaved) {
        throw new BadRequestException('Coordinate already created');
      }
    }

    // Close neighborhood

    const coordinateSaved = await this.coordinateRepository.save({
      neighborhood: newNeighborhood,
      latitude: createNeighborhoodDto.coordinates[0].lat,
      longitude: createNeighborhoodDto.coordinates[0].lng,
    });

    if (!coordinateSaved) {
      throw new BadRequestException('Coordinate already created');
    }

    return true;
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

  async findAllCitiesByProvince(idProvince: number) {
    const cities = await this.provinceRepository
      .createQueryBuilder('province')
      .innerJoinAndSelect('province.cities', 'city')
      .where('province.idProvince = :idProvince', { idProvince })
      .select(['city.idCity AS "idCity"', 'city.cityName AS "cityName"'])
      .orderBy('city.cityName')
      .groupBy('city.idCity')
      .getRawMany();

    return cities;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
