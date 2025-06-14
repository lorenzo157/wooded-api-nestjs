import { PartialType } from '@nestjs/swagger';

export class UpdateCampaignDto {
  projectName: string;
  campaignDescription: string;
  pruningTraining: number;
  pruningSanitary: number;
  pruningHeightReduction: number;
  pruningBranchThinning: number;
  pruningSignClearing: number;
  pruningPowerLineClearing: number;
  pruningRootDeflectors: number;
  cabling: number;
  fastening: number;
  propping: number;
  permeableSurfaceIncreases: number;
  moveTarget: number;
  restrictAccess: number;
  fertilizations: number;
  descompression: number;
  drains: number;
  extractions: number;
  plantations: number;
  openingsPot: number;
  advancedInspections: number;
}
