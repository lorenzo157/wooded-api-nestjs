interface LatLng {
  lat: number;
  lng: number;
}

interface DefectTree {
  defectName: string;
  defectValue: number;
  textDefectValue: string;
  branches: number;
}

export interface TreeData {
  idTree: number;
  idNeighborhood: number;
  latitude: number;
  longitude: number;
  address: string;
  datetime: Date;
  isDead?: boolean;
  isMissing?: boolean;
  risk: number;
  height?: number;
  perimeter?: number;
  dch?: number;
  vigor?: string;
  treesInTheBlock?: number;
  useUnderTheTree?: string;
  frequencyUse?: number;
  potentialDamage?: number;
  isMovable?: boolean;
  isRestrictable?: boolean;
  exposedRoots?: boolean;
  windExposure?: string;
  canopyDensity?: string;
  growthSpace?: string;
  treeValue?: string;
  streetMateriality?: string;
  conflictsNames?: string[];
  defects?: DefectTree[];
  diseasesNames?: string[];
  interventionsNames?: string[];
  pestsNames?: string[];
  treeTypeName?: string;
  gender?: string;
  species?: string;
  scientificName?: string;
  color?: string;
}

interface NeighborhoodData {
  idNeighborhood: number;
  neighborhoodName: string;
  coordinates: LatLng[];
}

export interface TreeRequestData {
  neighborhoodData: NeighborhoodData[];
  treeData: TreeData[];
}
