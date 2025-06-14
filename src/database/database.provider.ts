import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvVars } from '../config-loader';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

export const DatabaseProvider: DynamicModule = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return {
      type: 'postgres',
      host: config.get(EnvVars.dbHost),
      port: parseInt(config.get(EnvVars.dbPort)),
      username: config.get(EnvVars.dbUser),
      password: config.get(EnvVars.dbPassword),
      database: config.get(EnvVars.dbDatabase),
      schema: config.get(EnvVars.dbSchema),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: false, //config.get(EnvVars.enviroment) === 'development',
      migrationsRun: false,
      logging: true,
      migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
      cli: {
        migrationsDir: '../migrations',
      },
    } as TypeOrmModuleOptions;
  },
});
