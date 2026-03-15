import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeService } from './tree.service';
import { TreeController } from './tree.controller';
import { Trees } from './entities/Trees'; // Asegúrate de que es el nombre correcto de tu entidad
import { Projects } from '../project/entities/Projects';
import { Conflicts } from './entities/Conflicts';
import { ConflictTree } from './entities/ConflictTree';
import { Coordinates } from '../location/entities/Coordinates';
import { Defects } from './entities/Defects';
import { DefectTree } from './entities/DefectTree';
import { Diseases } from './entities/Diseases';
import { DiseaseTree } from './entities/DiseaseTree';
import { Interventions } from './entities/Interventions';
import { InterventionTree } from './entities/InterventionTree';
import { Pests } from './entities/Pests';
import { PestTree } from './entities/PestTree';
import { Neighborhoods } from '../unitwork/entities/Neighborhoods';
import { ProjectModule } from '../project/project.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trees,
      Coordinates,
      Conflicts,
      ConflictTree,
      Defects,
      DefectTree,
      Diseases,
      DiseaseTree,
      Interventions,
      InterventionTree,
      Pests,
      PestTree,
      Neighborhoods,
      Projects,
    ]),
    forwardRef(() => ProjectModule),
    UtilsModule,
  ], // Importa el repositorio
  providers: [TreeService],
  controllers: [TreeController],
  exports: [TreeService],
})
export class TreeModule {}
