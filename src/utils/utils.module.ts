import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { LocalFileStorageService } from './local-file-storage.service';
import { FileStorageFactory } from './file-storage.factory';
import { FileController } from './file.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [FileController],
  providers: [S3Service, LocalFileStorageService, FileStorageFactory],
  exports: [S3Service, LocalFileStorageService, FileStorageFactory],
})
export class UtilsModule {}
