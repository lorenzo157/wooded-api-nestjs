import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project', maxLength: 25 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  projectName: string;

  @ApiProperty({ description: 'Description of the project', maxLength: 25 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  projectDescription: string;

  @ApiProperty({ description: 'Start date of the project' })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of the project' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Project type', maxLength: 25 })
  @IsString()
  @IsNotEmpty()
  projectType: string;

  @IsString()
  @IsNotEmpty()
  cityName: string;

  @IsString()
  @IsNotEmpty()
  provinceName: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
