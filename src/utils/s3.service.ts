import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config-loader';

@Injectable()
export class S3Service {
  private bucketName;
  private region = 'us-east-1';
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    AWS.config.update({
      region: this.region,
      accessKeyId: this.configService.get(EnvVars.s3AccessKey),
      secretAccessKey: this.configService.get(EnvVars.s3SecretAccessKey),
    });
    this.bucketName = this.configService.get(EnvVars.s3Bucket);
    // Initialize S3 instance
    this.s3 = new AWS.S3();
  }
  // Upload method
  async uploadPhotoFile(photoFile: string, pathPhotoFile: string) {
    const decodeFile = Buffer.from(photoFile, 'base64');
    const params = {
      Bucket: this.bucketName,
      Key: pathPhotoFile,
      Body: decodeFile,
      ACL: 'public-read',
    };
    try {
      const responseS3 = await this.s3.upload(params).promise();
      return responseS3;
    } catch (error) {
      throw error;
    }
  }
  async deleteFile(pathFile: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: pathFile,
    };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw error;
    }
  }
}
