export class ReadProjectDto {
  idProject: number;
  projectName: string;
  projectDescription: string | null;
  startDate: string;
  endDate: string | null;
  projectType: boolean;
  cityName: string | null;
  provinceName: string | null;
}
