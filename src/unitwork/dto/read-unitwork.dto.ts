export interface ReadUnitWorkDto {
  idUnitWork: number;
  projectId: number;
  neighborhoodId: number;
  neighborhoodName: string;
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
  campaignDescription: string;
  pruningTraining: number;
  pruningSanitary: number;
  pruningHeightReduction: number;
  pruningBranchThinning: number;
  pruningSignClearing: number;
  pruningPowerLineClearing: number;
  pruningRootDeflectors: number;
}
