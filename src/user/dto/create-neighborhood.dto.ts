export class Coordinates {
  latitude: number;
  longitude: number;
}

export class CreateNeighborhoodDto {
  cityName: string;
  provinceName: string;
  neighborhoodName: string;
  numBlocksInNeighborhood: number;
  coordinates: Coordinates[];
}
