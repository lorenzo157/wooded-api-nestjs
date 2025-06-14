import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Description of the campaign' })
  @IsString()
  @IsNotEmpty()
  campaignDescription: string;
}
