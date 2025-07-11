import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config-loader';
import { IFileStorageService } from './interfaces/file-storage.interface';
import { S3Service } from './s3.service';
import { LocalFileStorageService } from './local-file-storage.service';

@Injectable()
export class FileStorageFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  getFileStorageService(): IFileStorageService {
    const storageType = this.configService.get(EnvVars.fileStorageType);
    
    switch (storageType.toLowerCase()) {
      case 'local':
        return this.localFileStorageService;
      case 's3':
      default:
        return this.s3Service;
    }
  }
}
