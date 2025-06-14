export class ReadUserDto {
  idUser: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleName: string;
  phoneNumber: string | null;
  address: string | null;
  cityName: string;
  provinceName: string;
}
