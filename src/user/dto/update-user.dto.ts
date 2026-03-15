export class UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string | null;
  address: string | null;
  heightMeters?: number;
  cityName: string;
  provinceName: string;
  roleName: string;
}
