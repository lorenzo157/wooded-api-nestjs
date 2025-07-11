import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config-loader';
import { IFileStorageService, FileUploadResult } from './interfaces/file-storage.interface';

@Injectable()
export class S3Service implements IFileStorageService {
  private bucketName;
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    AWS.config.update({
      region: this.configService.get(EnvVars.s3Region),
      accessKeyId: this.configService.get(EnvVars.s3AccessKey),
      secretAccessKey: this.configService.get(EnvVars.s3SecretAccessKey),
    });
    this.bucketName = this.configService.get(EnvVars.s3Bucket);
    // Initialize S3 instance
    this.s3 = new AWS.S3();
  }

  // Implementation of IFileStorageService interface
  async uploadFile(fileData: string, filePath: string): Promise<FileUploadResult> {
    const decodeFile = Buffer.from(fileData, 'base64');
    const params = {
      Bucket: this.bucketName,
      Key: filePath,
      Body: decodeFile,
      ACL: 'public-read',
    };
    try {
      const responseS3 = await this.s3.upload(params).promise();
      return {
        url: responseS3.Location,
        filePath: filePath
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: filePath,
    };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw error;
    }
  }
  
  getFileUrl(filePath: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${filePath}`;
  }
}
