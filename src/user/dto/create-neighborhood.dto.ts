export class Coordinates {
  lat: number;
  lng: number;
}

export class CreateNeighborhoodDto {
  idCity: number;
  neighborhoodName: string;
  numBlocksInNeighborhood: number;
  coordinates: Coordinates[];
}
