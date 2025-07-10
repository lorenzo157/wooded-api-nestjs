import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, IsDate, IsNumber, isNumber } from 'class-validator';

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
  //@IsDate()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of the project' })
  //@IsDate()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Project type', maxLength: 25 })
  @IsBoolean()
  projectType: string;

  @IsNumber()
  @IsNotEmpty()
  cityId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
