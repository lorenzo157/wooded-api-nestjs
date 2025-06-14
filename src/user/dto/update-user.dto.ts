export class UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string | null;
  address: string | null;
  idCity: number;
  idRole: number;
}
