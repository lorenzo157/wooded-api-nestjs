import { IsBase64, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDefectTreeDto } from './create-defect-tree.dto';
export class CreateTreeDto {
  @ApiProperty({ description: 'Name to the tree photo file'})
  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoFileName?: string;

  @ApiProperty({ description: 'Tree photo file'})
  @IsBase64()
  @IsOptional()
  photoFile: string;

  @ApiProperty({ description: 'City block number'})
  @IsOptional()
  @IsNumber()
  cityBlock: number;

  @ApiProperty({ description: 'Perimeter of the tree'})
  @IsOptional()
  @IsNumber()
  perimeter?: number;

  @ApiProperty({ description: 'Height of the tree'})
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: 'Incline of the tree'})
  @IsOptional()
  @IsNumber()
  incline?: number;

  @ApiProperty({
    description: 'Number of trees in the block',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  treesInTheBlock?: number;

  @ApiProperty({ description: 'Use under the tree'})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  useUnderTheTree?: string;

  @ApiProperty({ description: 'Frequency of use'})
  @IsOptional()
  @IsNumber()
  frequencyUse?: number;

  @ApiProperty({ description: 'Potential damage' })
  @IsOptional()
  @IsNumber()
  potentialDamage?: number;

  @ApiProperty({ description: 'Is the tree movable?'})
  @IsOptional()
  @IsBoolean()
  isMovable?: boolean;

  @ApiProperty({ description: 'Is the tree restrictable?' })
  @IsOptional()
  @IsBoolean()
  isRestrictable?: boolean;

  @ApiProperty({ description: 'Is the tree missing?'})
  @IsOptional()
  @IsBoolean()
  isMissing?: boolean;

  @ApiProperty({ description: 'Is the tree dead?'})
  @IsOptional()
  @IsBoolean()
  isDead?: boolean;

  @ApiProperty({
    description: 'Does the tree have exposed roots?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  exposedRoots?: boolean;

  @ApiProperty({ description: 'DCH value' })
  @IsOptional()
  @IsNumber()
  dch?: number;

  @ApiProperty({
    description: 'Wind exposure',
    required: false,
    enum: ['expuesto', 'parcialmente expuesto', 'protegido', 'tunel de viento'],
  })
  @IsOptional()
  @IsEnum(['expuesto', 'parcialmente expuesto', 'protegido', 'tunel de viento'])
  windExposure?: 'expuesto' | 'parcialmente expuesto' | 'protegido' | 'tunel de viento';

  @ApiProperty({
    description: 'Tree vigor',
    required: false,
    enum: ['excelente', 'normal', 'pobre'],
  })
  @IsOptional()
  @IsEnum(['excelente', 'normal', 'pobre'])
  vigor?: 'excelente' | 'normal' | 'pobre';

  @ApiProperty({
    description: 'Canopy density',
    required: false,
    enum: ['escasa', 'normal', 'densa'],
  })
  @IsOptional()
  @IsEnum(['escasa', 'normal', 'densa'])
  canopyDensity?: 'escasa' | 'normal' | 'densa';

  @ApiProperty({
    description: 'Growth space',
    required: false,
    enum: ['sin cazuela', 'cazuela = 1 - 2 m2', 'cazuela > 2 m2', 'vereda jardin'],
  })
  @IsOptional()
  @IsEnum(['sin cazuela', 'cazuela = 1 - 2 m2', 'cazuela > 2 m2', 'vereda jardin'])
  growthSpace?: 'sin cazuela' | 'cazuela = 1 - 2 m2' | 'cazuela > 2 m2' | 'vereda jardin';

  @ApiProperty({
    description: 'Tree value',
    required: false,
    enum: ['historico', 'monumental', 'singular', 'notable', 'plaza/parque (ornamental)', 'reclamo'],
  })
  @IsOptional()
  @IsEnum(['historico', 'monumental', 'singular', 'notable', 'plaza/parque (ornamental)', 'reclamo'])
  treeValue?: 'historico' | 'monumental' | 'singular' | 'notable' | 'plaza/parque (ornamental)' | 'reclamo';

  @ApiProperty({
    description: 'Street materiality',
    required: false,
    enum: ['tierra', 'mejorado petroleo', 'asfalto', 'concreto', 'cordon cuneta'],
  })
  @IsOptional()
  @IsEnum(['tierra', 'mejorado petroleo', 'asfalto', 'concreto', 'cordon cuneta'])
  streetMateriality?: 'tierra' | 'mejorado petroleo' | 'asfalto' | 'concreto' | 'cordon cuneta';

  @ApiProperty({ description: 'Array of conflicts' })
  @IsOptional()
  conflictsNames?: string[];

  @ApiProperty({ description: 'Dto of defects' })
  @IsOptional()
  createDefectsDtos: CreateDefectTreeDto[];

  @ApiProperty({ description: 'Array of diseases' })
  @IsOptional()
  diseasesNames?: string[];

  @ApiProperty({ description: 'Array of interventions' })
  @IsOptional()
  interventionsNames?: string[];

  @ApiProperty({ description: 'Array of pests' })
  @IsOptional()
  pestsNames?: string[];

  @IsNumber()
  @IsNotEmpty()
  latitude?: number;

  @IsNumber()
  @IsNotEmpty()
  longitude?: number;

  @ApiProperty({ description: 'Project ID', required: true })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({ description: 'Tree Type' })
  @IsString()
  @IsOptional()
  treeTypeName?: string;

  @ApiProperty({ description: 'Gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'The date and time when the tree information was collected',
    example: '2025-07-04T10:00:00Z',
    required: false,
  })
  treeInfoCollectionStartTime?: Date;
}
